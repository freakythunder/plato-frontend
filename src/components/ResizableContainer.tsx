import React, { useState, useRef, useCallback } from 'react';
import HorizontalSplitter from './horizontalSplitter';
import ChatInterface, { ChatInterfaceRef as ImportedChatInterfaceRef } from './ChatInterface'; // Alias the imported type
import styles from '../Styles/ResizableContainer.module.css';

interface ChatInterfaceRef {
}

const ResizableContainer: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const chatInterfaceRef = useRef<ImportedChatInterfaceRef>(null); // Correct ref initialization


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
      <ChatInterface ref={chatInterfaceRef} />
      </div>
      <div className={styles.resizer} onMouseDown={handleMouseDown} />
      <div className={styles.rightPane} style={{ width: `${100 - leftWidth}%` }}>
        <HorizontalSplitter chatInterfaceRef={chatInterfaceRef}/>
      </div>
    </div>
  );
};

export default ResizableContainer;