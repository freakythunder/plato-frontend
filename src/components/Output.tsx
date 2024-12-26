import React, { useRef, useEffect } from 'react';
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
}

const Output: React.FC<OutputProps> = ({ output, isLoading, onClose, containerWidth, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);


  return (
    <div
      ref={containerRef}
      className={styles.outputContainer}
      
    >
      <div className={styles.outputHeader}>
        <h3>Output</h3>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
      <div className={styles.outputContent}>
        {(
          <SyntaxHighlighter language="python" style={vscDarkPlus} wrapLines={true}>
            {output}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

export default Output;
