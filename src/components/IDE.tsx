import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import styles from '../Styles/IDE.module.css';
import { executeCode } from '../services/codeService';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/AppContext';
import posthog from 'posthog-js';
interface IDEProps {
  height: number;
  onRun: (output: string) => void;
  onWebSocketCreate: (ws: WebSocket) => void; 
}
export interface IDERef {
  getCode: () => string; 
}

const languageMap: { [key: string]: string } = {
  python: 'python',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  javascript: 'javascript',
  dsa : 'cpp'
};

const IDE = forwardRef<IDERef, IDEProps>(({ height, onRun, onWebSocketCreate }, ref) => {
  const placeholderText = `
  /*
  This is the code editor where you will practice writing code. 
  Just follow the instructions in the section to the left.
  */
  `;
  const { shouldClearCode, setShouldClearCode } = useAuth();
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaceholderActive, setIsPlaceholderActive] = useState<boolean>(true);
  const editorRef = useRef<any>(null);
  const hasRunButtonClicked = useRef<boolean>(false);
  const runButtonRef = useRef<HTMLButtonElement | null>(null);
  const { setHasRunCode } = useProgress();
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const wasEditorFocused = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    getCode: () => code,
  }));

  const getInitialLanguage = () => {
    
    const stored = localStorage.getItem('language');
    if(stored !== null){
      if(stored === 'DSA_Practice') {
        return 'cpp'; 
      }
      return languageMap[stored.toLowerCase()] || 'javascript';
    }
    
  };
  const [editorLanguage, setEditorLanguage] = useState(getInitialLanguage());
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    const lang = localStorage.getItem('language');
    if (lang && editorRef.current && monacoRef.current) {
      const newLang = languageMap[lang.toLowerCase()] || 'javascript';
      setEditorLanguage(newLang);
      const model = editorRef.current.getModel();
      monacoRef.current.editor.setModelLanguage(model, newLang);
      console.log("Editor language updated to:", newLang);
    }
  }, [localStorage.getItem('language')]);

  useEffect(() => {
    if (shouldClearCode) {
      setCode('');
      setShouldClearCode(false);
      console.log("Code cleared due to shouldClearCode flag");
    }
  }, [shouldClearCode, setShouldClearCode]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Important: Set initial height explicitly to prevent layout shift
    if (editor && editor.getDomNode()) {
      const container = editor.getDomNode().parentElement;
      if (container) {
        container.style.height = '100%';
      }
    }
    
    editor.onDidFocusEditorWidget(() => {
      // Only handle significant changes if it's the first focus
      if (isPlaceholderActive || !wasEditorFocused.current) {
        wasEditorFocused.current = true;
        
        // Update language without causing layout shift
        if (monacoRef.current) {
          editor.updateOptions({ language: editorLanguage });
          console.log("Editor focused, updating language options");
        }
      }
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && value !== placeholderText) {
      setCode(value);
      setIsPlaceholderActive(false);
      console.log("Editor code updated");
    }
  };

  // Single cleanup effect with explicit valid close code and logging.
  useEffect(() => {
    return () => {
      if (wsConnection && wsConnection.readyState !== WebSocket.CLOSED) {
        console.log("Component unmounting: closing WebSocket with code 1000");
        wsConnection.close(1000, 'Component unmount');
      } else {
        console.log("No active WebSocket connection to close on unmount");
      }
    };
  }, [wsConnection]);

  const handleRunCode = async () => {
    if (isPlaceholderActive) return;
    hasRunButtonClicked.current = true;
    setIsLoading(true);
    console.log("Run code initiated. isLoading set to true.");
    try {
      const { ws, promise } = executeCode(code || '');
      setWsConnection(ws);
      onWebSocketCreate(ws);
      ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stdout' || data.type === 'stderr') {
          onRun(data.data);
        }
      });
      const result = await promise;
      console.log("Execution result received:", result);
      console.log("output: ", result.data.output);
      onRun(result.data.output);
      posthog.capture('code_run_clicked' , {
        error : result.data.executionSuccess
      });
      if (result.data.executionSuccess) {
        setHasRunCode(true);
        
        console.log("Execution successful; setHasRunCode updated.");
      }
    } catch (error) {
      console.log("Error during execution:", error);
      if (error instanceof Error) {
        onRun(`Error: ${error.message}`);
      } else {
        onRun('Error: Unknown execution error');
      }
    } finally {
      console.log("Finalizing run: setting isLoading to false.");
      setIsLoading(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const clickedElement = event.target as HTMLElement;
    if (
      editorRef.current &&
      !editorRef.current.getDomNode().contains(clickedElement) &&
      runButtonRef.current !== clickedElement &&
      !runButtonRef.current?.contains(clickedElement)
    ) {
      if (!hasRunButtonClicked.current && (!code || !code.trim())) {
        setIsPlaceholderActive(true);
        console.log("Click outside detected; activating placeholder.");
      }
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [code]);

  return (
    <div className={styles.ideContainer}>
      <div className={styles.buttonContainer}>
        <button
          ref={runButtonRef}
          className={styles.runButton}
          onClick={handleRunCode}
          disabled={isPlaceholderActive || isLoading}
        >
          {isLoading ? 'Running...' : 'Run'}
        </button>
      </div>
      <div 
        className={styles.editorContainer}
        style={{ height: '100%' }} // Explicitly set height
      >
        <Editor
          language={editorLanguage}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fixedOverflowWidgets: true, // Prevents widgets from affecting layout
          }}
          onMount={handleEditorDidMount}
          height="100%" // Explicitly set height to 100%
        />
        {isPlaceholderActive && (
          <div className={styles.placeholderOverlay}>
            {placeholderText}
          </div>
        )}
      </div>
    </div>
  );
});

export default IDE;
