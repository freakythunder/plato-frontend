import React, { useState, useRef, useCallback } from 'react';
import HorizontalSplitter from './horizontalSplitter';
import ChatInterface from './ChatInterface'; // Alias the imported type
import styles from '../Styles/ResizableContainer.module.css';



const ResizableContainer: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(45);
  const [code, setCode] = useState<string>(''); 
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
   // Correct ref initialization
   const handleNewAIMessage = () => {
    // Logic to handle new AI message
    console.log("New AI message received, clearing IDE code.");
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;

    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(newLeftWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);


  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.leftPane} style={{ width: `${leftWidth}%` }}>
      <ChatInterface code={code}  /> {/* Pass the trigger function */}
      </div>
      <div className={styles.resizer} onMouseDown={handleMouseDown} />
      <div className={styles.rightPane} style={{ width: `${100 - leftWidth}%` }}>
      <HorizontalSplitter onCodeChange={setCode}  />
      </div>
    </div>
  );
};

export default ResizableContainer;