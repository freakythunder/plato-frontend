import React, { useState, useRef, useEffect, useCallback } from 'react';
import IDE, { IDERef } from './IDE';
import ResizableOutput from './Output';
import styles from '../Styles/HorizontalSplitter.module.css';
interface HorizontalSplitterProps {
  onCodeChange: (code: string) => void; 
  
}
const HorizontalSplitter: React.FC<HorizontalSplitterProps> = ({ onCodeChange}) => {
  const [outputHeightPercent, setOutputHeightPercent] = useState(30); // Output height in %
  const [ideHeightPercent, setIdeHeightPercent] = useState(70); // IDE height in %
  const [output, setOutput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const ideRef = useRef<IDERef>(null);
  const handleGetCode = () => {
    const currentCode = ideRef.current?.getCode();
    if (currentCode) {
      onCodeChange(currentCode); // Pass the current code to the parent
    }
  };
  // Function to calculate the container height in pixels
  const calculateContainerHeight = () => containerRef.current?.clientHeight || window.innerHeight;

  // Update heights based on output height percentage
  useEffect(() => {
    const containerHeight = calculateContainerHeight();
    setIdeHeightPercent(100 - outputHeightPercent); // Ensure IDE takes 100% minus the output space
  }, [outputHeightPercent]);

  // Callback to handle code output and open the output pane
  const handleRunCode = useCallback((output: string) => {
    setOutput(output);
    setOutputHeightPercent(30);
    handleGetCode (); // Set initial output height to 30%
  }, []);

  // Close output and reset IDE to full height
  const handleCloseOutput = () => {
    setOutputHeightPercent(0);
    setIdeHeightPercent(100); // IDE takes up full height
  };

  // Handle dynamic resizing of output and IDE
  const handleMouseMove = (event: MouseEvent) => {
    if (!isResizing.current) return;

    const containerHeight = calculateContainerHeight();
    const newOutputHeightPercent = ((containerHeight - event.clientY) / containerHeight) * 100;

    if (newOutputHeightPercent >= 5 && newOutputHeightPercent <= 60) { // Set bounds in percentage (5%-60%)
      setOutputHeightPercent(newOutputHeightPercent);
      setIdeHeightPercent(100 - newOutputHeightPercent);
    }
  };

  const handleMouseDown = () => {
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (splitterRef.current) {
      splitterRef.current.addEventListener('mousedown', handleMouseDown);
    }
    return () => {
      splitterRef.current?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.splitterContainer} style={{ position: 'relative', height: '100%' }}>
      {/* IDE Section */}
      <div className={styles.ideSection} style={{ height: `${ideHeightPercent}%`, overflow: 'hidden' }}>
        <IDE ref={ideRef} height={ideHeightPercent} onRun={handleRunCode}  />
      </div>

      {/* Splitter Section */}
      <div ref={splitterRef} className={styles.splitter}></div>

      {/* Output Section */}
      <div className={styles.outputSection} style={{ height: outputHeightPercent ? `${outputHeightPercent}%` : '0', display: outputHeightPercent ? 'block' : 'none' }}>
        <ResizableOutput output={output} isLoading={false} onClose={handleCloseOutput} containerWidth={containerRef.current?.clientWidth || 0} height={outputHeightPercent} />
      </div>
    </div>
  );
};

export default HorizontalSplitter;