import React, { createContext, useState, useContext, useEffect } from 'react';

interface ProgressContextType {
  hasRunCode: boolean;
  hasClickedNextButton: boolean;
  setHasRunCode: (hasRunCode: boolean) => void;
  setHasClickedNextButton: (hasClickedNextButton: boolean) => void;
  currentSubtopic: string;
  setCurrentSubtopic: (currentSubtopic: string) => void;
  currentTopic: Topic | null;
  setCurrentTopic: (currentTopic: Topic) => void;
}
interface Topic {
  id: number;
  name: string;
  subtopics: Subtopic[];
  completed: boolean;
}
interface Subtopic {
  id: number;
  name: string;
  completed: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasRunCode, setHasRunCode] = useState(false);
  const [hasClickedNextButton, setHasClickedNextButton] = useState(false);
  const [currentSubtopic, setCurrentSubtopic] = useState('');
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

  return (
    <ProgressContext.Provider value={{ hasRunCode, hasClickedNextButton, setHasRunCode, setHasClickedNextButton, currentSubtopic, setCurrentSubtopic,currentTopic, setCurrentTopic }}>
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