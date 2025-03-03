import { v4 as uuidv4 } from 'uuid';

// Define return type interface
interface ExecutionResult {
  ws: WebSocket;
  promise: Promise<{
    data: {
      output: string;
      executionSuccess: boolean;
    }
  }>;
}

export const executeCode = (code: string): ExecutionResult => {
  const sessionId = uuidv4();
  let language = localStorage.getItem('language') || 'python';
  if(language === 'DSA' || language === 'DSA_Practice') {
    language = 'c++';  // DSA is not a valid language for the code executor
  }
  const lowercaselanguage = language.toLowerCase();
  const ws = new WebSocket(`wss://code-executor-app.ambitioussmoke-08c18a0b.eastus2.azurecontainerapps.io/`);
  language = lowercaselanguage;
  // Add connection state tracking
  let isConnectionOpen = false;

  const output: string[] = [];
  let executionSuccess = false
  let inputRequired = false;
  let connectionClosed = false;
  let resolvePromise: (value: any) => void;
  let rejectPromise: (reason?: any) => void;
  const connectionTimeout = setTimeout(() => {
    if (!connectionClosed) {
      ws.close(1000, 'Input timeout');
      connectionClosed = true;
    }
  }, 30000);
  // Add debug logs
  console.log('Initializing WebSocket connection...');
  console.log('Current language:', language);

  const promise = new Promise<{ data: { output: string; executionSuccess: boolean } }>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;

    ws.onopen = () => {
      console.log('WebSocket connection opened');
      ws.send(JSON.stringify({
        type: 'execute', // Required by server
        language,
        code: code || '',
        inputs: []
      }));
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'stdout':
          output.push(data.data);
          break;
        case 'input_required':
          inputRequired = true;
          break;
        case 'stderr':
          output.push(`ERROR: ${data.data}`);
          clearTimeout(connectionTimeout);
          break;
          break;
        case 'exit':
          
        clearTimeout(connectionTimeout);
        inputRequired = false;
        executionSuccess = data.code === 0;
        if (!connectionClosed) {
          connectionClosed = true;
          ws.close(1000, 'Normal closure after exit');
        }
        resolvePromise({
          data: {
            output: output.join('\n'),
            executionSuccess
          }
        });
        break;
        case 'error':
          clearTimeout(connectionTimeout);
          rejectPromise(new Error(data.data));
          break;
        case 'complete':
          clearTimeout(connectionTimeout);
          if (!connectionClosed) {
            connectionClosed = true;
            ws.close(1000, 'Normal closure after complete');
          }
          resolvePromise({
            data: {
              output: output.join('\n'),
              executionSuccess
            }
          });
          break;
      }
    };

    ws.onclose = (event) => {
      if (!connectionClosed) {
        connectionClosed = true;
        clearTimeout(connectionTimeout);
        if (event.wasClean) {
          resolvePromise({
            data: {
              output: output.join('\n'),
              executionSuccess
            }
          });
        } else {
          rejectPromise(new Error(`Connection closed: ${event.reason || 'Unknown reason'}`));
        }
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      rejectPromise(error);
    };
  });

  return {
    ws,
    promise
  };
};
