import React, { useRef, useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from '../Styles/ResizableOutput.module.css';
import { useAuth } from '../context/AuthContext';

interface OutputProps {
  output: string;
  isLoading: boolean;
  onClose: () => void;
  containerWidth: number;
  height: number;
  webSocket?: WebSocket;
}

const Output: React.FC<OutputProps> = ({ output, isLoading, onClose, containerWidth, height, webSocket }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState('');
  const [inputRequired, setInputRequired] = useState(false);

  useEffect(() => {
    if (!webSocket) return;

    const messageHandler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'input_required') {
        setInputRequired(true);
      }
    };

    webSocket.addEventListener('message', messageHandler);
    return () => {
      webSocket.removeEventListener('message', messageHandler);
    };
  }, [webSocket]);

  const handleSubmit = () => {
    if (webSocket && userInput.trim()) {
      webSocket.send(
        JSON.stringify({
          type: 'input',
          value: userInput, // Ensure newline is added
        })
      );
      setUserInput('');
      setInputRequired(false);
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: 'keepalive' }));
      }
    }
  };

  return (
    <div ref={containerRef} className={styles.outputContainer}>
      <div className={styles.outputHeader}>
        <h3>Output</h3>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
      <div className={styles.outputContent}>
        <SyntaxHighlighter language="python" style={vscDarkPlus} wrapLines={true}>
          {output}
        </SyntaxHighlighter>
      </div>
      {inputRequired && (
        <div className={styles.inputContainer}>
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter program input..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button onClick={handleSubmit}>Send Input</button>
        </div>
      )}
    </div>
  );
};

export default Output;
