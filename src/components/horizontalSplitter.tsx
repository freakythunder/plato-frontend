import React, { useState, useRef, useEffect, useCallback } from 'react';
import IDE, { IDERef } from './IDE';
import ResizableOutput from './Output';
import styles from '../Styles/HorizontalSplitter.module.css';
import { useAuth } from '../context/AuthContext';

interface HorizontalSplitterProps {
  onCodeChange: (code: string) => void; 
}

const HorizontalSplitter: React.FC<HorizontalSplitterProps> = ({ onCodeChange }) => {
  const [outputHeightPercent, setOutputHeightPercent] = useState(30); // Output height in %
  const [ideHeightPercent, setIdeHeightPercent] = useState(70); // IDE height in %
  const [output, setOutput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const ideRef = useRef<IDERef>(null);
  const [activeWebSocket, setActiveWebSocket] = useState<WebSocket | null>(null);
  const { shouldClearCode, setShouldClearCode } = useAuth();

  useEffect(() => {
    if (shouldClearCode) {
      setOutput(''); // Clear the output when shouldClearCode is true
      setShouldClearCode(false); // Reset the variable
      console.log("Output cleared in HorizontalSplitter"); // Optional: Log for debugging
    }
  }, [shouldClearCode, setShouldClearCode]);

  // Improved handler for getting code
  const handleGetCode = useCallback(() => {
    const currentCode = ideRef.current?.getCode();
    if (currentCode) {
      onCodeChange(currentCode);
    }
  }, [onCodeChange]);

  // Function to calculate the container height in pixels
  const calculateContainerHeight = useCallback(() => 
    containerRef.current?.clientHeight || window.innerHeight, []);

  // Update heights based on output height percentage
  useEffect(() => {
    setIdeHeightPercent(100 - outputHeightPercent);
  }, [outputHeightPercent]);

  // Enhanced run code handler
  const handleRunCode = useCallback((output: string) => {
    setOutput(output);
    setOutputHeightPercent(30);
    handleGetCode();
  }, [handleGetCode]);

  // Close output and reset IDE to full height
  const handleCloseOutput = useCallback(() => {
    setOutputHeightPercent(0);
    setIdeHeightPercent(100);
  }, []);

  // Improved mouse move handler with boundary checking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    const containerHeight = calculateContainerHeight();
    const newOutputHeightPercent = ((containerHeight - event.clientY) / containerHeight) * 100;

    if (newOutputHeightPercent >= 5 && newOutputHeightPercent <= 60) {
      setOutputHeightPercent(newOutputHeightPercent);
      setIdeHeightPercent(100 - newOutputHeightPercent);
    }
  }, [calculateContainerHeight]);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Setup and cleanup event listeners
  useEffect(() => {
    const splitterElement = splitterRef.current;
    
    if (splitterElement) {
      splitterElement.addEventListener('mousedown', handleMouseDown);
    }
    
    return () => {
      if (splitterElement) {
        splitterElement.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={styles.splitterContainer} style={{ position: 'relative', height: '100%' }}>
      {/* IDE Section */}
      <div className={styles.ideSection} style={{ height: `${ideHeightPercent}%`, overflow: 'hidden' }}>
      <IDE ref={ideRef} onWebSocketCreate={setActiveWebSocket} height={ideHeightPercent} onRun={handleRunCode} />
      </div>

      {/* Splitter Section */}
      <div ref={splitterRef} className={styles.splitter}></div>

      {/* Output Section */}
      <div className={styles.outputSection} style={{ height: outputHeightPercent ? `${outputHeightPercent}%` : '0', display: outputHeightPercent ? 'block' : 'none' }}>
        <ResizableOutput output={output} webSocket={activeWebSocket} isLoading={false} onClose={handleCloseOutput} containerWidth={containerRef.current?.clientWidth || 0} height={outputHeightPercent} />
      </div>
    </div>
  );
};

export default HorizontalSplitter;