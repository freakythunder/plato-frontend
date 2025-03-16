import React, { useState, useRef, useCallback, useEffect } from 'react';
import HorizontalSplitter from './horizontalSplitter';
import ChatInterface from './ChatInterface';
import styles from '../Styles/ResizableContainer.module.css';
import { useAuth } from '../context/AuthContext';

const ResizableContainer: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [code, setCode] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const { shouldClearCode, setShouldClearCode } = useAuth();
  
  // Track if component has mounted
  const hasMounted = useRef(false);

  // Improve mouse move handling
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
      setCode('');
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

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Force layout recalculation when component mounts and on window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Force a reflow by accessing offsetHeight
        const height = containerRef.current.offsetHeight;
        console.log("Container height recalculated on resize:", height);
      }
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Initial calculation after mount
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        console.log("Initial container height:", height);
        // Set mounted flag after initial render
        hasMounted.current = true;
      }
    }, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div 
        className={styles.leftPane} 
        style={{ 
          width: `${leftWidth}%`,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <ChatInterface code={code} />
      </div>
      <div 
        className={styles.resizer}
        onMouseDown={handleMouseDown}
        style={{ 
          width: '6px',
          cursor: 'col-resize',
          zIndex: 10
        }}
      />
      <div 
        className={styles.rightPane} 
        style={{ 
          width: `${100 - leftWidth}%`,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <HorizontalSplitter
          onCodeChange={(code) => {
            setCode(code);
          }}
        />
      </div>
    </div>
  );
};

export default ResizableContainer;