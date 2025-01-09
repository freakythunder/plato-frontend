import React, { createContext, useState, useContext, useEffect } from 'react';

interface ProgressContextType {
  hasRunCode: boolean;
  hasClickedNextButton: boolean;
  setHasRunCode: (hasRunCode: boolean) => void;
  setHasClickedNextButton: (hasClickedNextButton: boolean) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasRunCode, setHasRunCode] = useState(false);
  const [hasClickedNextButton, setHasClickedNextButton] = useState(false);

  return (
    <ProgressContext.Provider value={{ hasRunCode, hasClickedNextButton, setHasRunCode, setHasClickedNextButton }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};