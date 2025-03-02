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
  practiceMode: boolean;
  setPracticeMode: (mode: boolean) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  allProblemSets: any[];
  setAllProblemSets: (sets: any[]) => void;
  allTopics: AllTopic[];
  setAllTopics: (topics: AllTopic[]) => void;
}
interface Topic {
  id: number;
  name: string;
  subtopics: Subtopic[];
  completed: boolean;
}
interface AllTopic {
  id: number;
  language: string;
  topics: Topic[];
}
 

interface Subtopic {
  id: number;
  name: string;
  completed: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize currentSubtopic from localStorage if available
  const [currentSubtopic, setCurrentSubtopic] = useState(() => localStorage.getItem('currentSubtopic') || '');
  const [hasRunCode, setHasRunCode] = useState(false);
  const [hasClickedNextButton, setHasClickedNextButton] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [allProblemSets, setAllProblemSets] = useState<any[]>(() => {
    const stored = localStorage.getItem('allProblemSets');
    return stored ? JSON.parse(stored) : [];
  });
  const [allTopics, setAllTopics] = useState<AllTopic[]>([]);

  // persist currentSubtopic in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentSubtopic', currentSubtopic);
  }, [currentSubtopic]);

  // persist allProblemSets in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('allProblemSets', JSON.stringify(allProblemSets));
  }, [allProblemSets]);

  return (
    <ProgressContext.Provider value={{
      hasRunCode,
      hasClickedNextButton,
      setHasRunCode,
      setHasClickedNextButton,
      currentSubtopic,
      setCurrentSubtopic,
      currentTopic,
      setCurrentTopic,
      practiceMode,
      setPracticeMode,
      prompt,
      setPrompt,
      allProblemSets,
      setAllProblemSets,
      allTopics,
      setAllTopics,
    }}>
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