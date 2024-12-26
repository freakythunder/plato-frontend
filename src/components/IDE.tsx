import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import styles from '../Styles/IDE.module.css';
import { executeCode } from '../services/codeService';
import { useAuth } from '../context/AuthContext';

interface IDEProps {
  height: number;
  onRun: (output: string) => void;
   
}
export interface IDERef {
  getCode: () => string; 
}

const IDE = forwardRef<IDERef, IDEProps>(({ height, onRun }, ref) => {
  const placeholderText = 
  `
  /*
  This is the code editor where you will practice writing code. 
  Just follow the instructions in the section to the left.  
  */
  `
  const { shouldClearCode, setShouldClearCode } = useAuth();
  const [code, setCode] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaceholderActive, setIsPlaceholderActive] = useState<boolean>(true);
  const editorRef = useRef<any>(null);
  const hasRunButtonClicked = useRef<boolean>(false);
  const runButtonRef = useRef<HTMLButtonElement | null>(null);

  useImperativeHandle(ref, () => ({
    getCode: () => code,
  }));
  

 
  useEffect(() => {
    if (shouldClearCode) {
      setCode(''); // Clear the code if the variable is true
      setShouldClearCode(false); // Reset the variable
      console.log("cleared in ide");
    }
  }, [shouldClearCode, setShouldClearCode]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    editor.onDidFocusEditorWidget(() => {
      if (isPlaceholderActive) {
         // Clear placeholder only on focus
      }
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && value !== placeholderText) {
      // Only update the code if it is different from the current code
        setCode(value);
        setIsPlaceholderActive(false);
      
    }
  };


  const handleRunCode = async () => {
    if (isPlaceholderActive) return;
    hasRunButtonClicked.current = true; // Prevent running placeholder text
    setIsLoading(true);
    try {
      const result = await executeCode(code);
      const output = result.success ? result.data.output : 'Error while executing code.';
      onRun(output); // Trigger output update immediately
    } catch {
      onRun('Error while executing code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    // Check if the click is outside the editor
    const clickedElement = event.target as HTMLElement;
    if (
      editorRef.current &&
      !editorRef.current.getDomNode().contains(clickedElement) && // Not inside editor
      runButtonRef.current !== clickedElement && // Not the "Run" button itself
      !runButtonRef.current?.contains(clickedElement) 
    ) {
      if (!hasRunButtonClicked.current &&(!code || !code.trim())) {
        setIsPlaceholderActive(true); // Show placeholder if no code and "Run" hasn't been clicked
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
          className={styles.runButton}
          onClick={handleRunCode}
          disabled={isPlaceholderActive || isLoading}
        >
          {isLoading ? 'Running...' : 'Run'}
        </button>
      </div>
      <div className={styles.editorContainer}>
        <Editor
          defaultLanguage="python"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
          onMount={handleEditorDidMount}
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
