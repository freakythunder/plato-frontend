import { v4 as uuidv4 } from 'uuid';

export const executeCode = (code: string) => new Promise((resolve, reject) => {
  const sessionId = uuidv4();
  let language = localStorage.getItem('language') || 'python';
  let lowercaselanguage = language.toLowerCase();
  const ws = new WebSocket(`wss://code-executor-app.ambitioussmoke-08c18a0b.eastus2.azurecontainerapps.io`);
  language = lowercaselanguage;
  const output: string[] = [];
  let executionSuccess = false;
  const connectionTimeout = setTimeout(() => {
    reject(new Error('Connection timeout'));
    ws.close();
  }, 5000);
  let connectionClosed = false;
  const flushBuffer = () => {
    if (!connectionClosed) {
      resolve({
        data: {
          output: output.join('\n'),
          executionSuccess
        }
      });
    }
  };
  ws.onopen = () => {
    clearTimeout(connectionTimeout);
    ws.send(JSON.stringify({
      language,
      code: code || '',
      inputs: [] // Add any input handling logic here
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch(data.type) {
      case 'stdout':
        output.push(data.data);
        console.log("data :",data.data);
        break;
      case 'stderr':
        output.push(`ERROR: ${data.data}`);
        break;
      case 'exit':
        executionSuccess = data.code === 0;
        // Delay closure to ensure final messages are processed
        setTimeout(() => ws.close(), 100);
        break;
      case 'complete':  // Add server-side completion message
        flushBuffer();
        break;
    }
  };

  ws.onclose = (event) => {
    connectionClosed = true;
    
    // Proper clean closure detection
    if (event.wasClean) {
      resolve({
        data: {
          output: output.join('\n'),
          executionSuccess
        }
      });
    } else {
      // Enhanced error details using CloseEvent properties
      const errorMessage = `Connection closed unexpectedly: 
        Code ${event.code} - ${event.reason || 'No reason provided'}`;
      reject(new Error(errorMessage));
    }
  };

  ws.onerror = (error) => {
    reject(error);
  };
});
