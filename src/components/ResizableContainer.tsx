import React, { useState, useRef, useCallback , useEffect } from 'react';
import HorizontalSplitter from './horizontalSplitter';
import ChatInterface from './ChatInterface'; // Alias the imported type
import styles from '../Styles/ResizableContainer.module.css';
import { useAuth } from '../context/AuthContext';



const ResizableContainer: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [code, setCode] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const { shouldClearCode, setShouldClearCode } = useAuth();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;

    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(newLeftWidth);
    }
  }, []);
  useEffect(() => {
    if (shouldClearCode) {
      setCode(''); // Clear the code if the variable is true
      console.log("cleared in chat");
    }
  }, [shouldClearCode, setShouldClearCode]);
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
        <ChatInterface code={code} /> {/* Pass the clearCode function */}
      </div>
      <div className={styles.resizer} onMouseDown={handleMouseDown} />
      <div className={styles.rightPane} style={{ width: `${100 - leftWidth}%` }}>
        <HorizontalSplitter
          onCodeChange={(code) => {
            console.log('Passing code to HorizontalSplitter:', code);
            setCode(code);
          }}
        />
      </div>
    </div>
  );
};

export default ResizableContainer;