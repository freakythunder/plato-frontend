// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

interface AuthContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
  isAuthenticated: boolean;
  login: (username: string, token: string, welcomeMsg?: string, topics?: any) => void;
  localLogout: () => void;
  welcomeMessage: string | null;
  clearWelcomeMessage: () => void;
  shouldClearCode: boolean; // New variable
  setShouldClearCode: (value: boolean) => void; // New function
  topics: any;
  setTopics: (topics: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [shouldClearCode, setShouldClearCode] = useState<boolean>(false); // Initialize the new variable
  
  const [topics, setTopics] = useState<any>(() => {
    const storedTopics = localStorage.getItem('topics');
    return storedTopics ? JSON.parse(storedTopics) : null;
  });

   const login = (username: string, token: string, message: string) => {
    
    
    localStorage.setItem('username', username);
    localStorage.setItem('token', token);
    
    const trimmedMessage = message.trim().toLowerCase();
   

    if (trimmedMessage === 'user  registered') {
      localStorage.setItem('IsNewUser ', 'true'); // Store new user status
    } else {
      localStorage.setItem('IsNewUser ', 'false'); // Store returning user status
      
    }
    setUsername(username);
    setIsAuthenticated(true);
    
  };

  const localLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('welcomeMessage');
    localStorage.removeItem('showInitialButton');
    localStorage.removeItem('showActionButtons');
    localStorage.clear();
    setUsername(null);
    setWelcomeMessage(null);
    setIsAuthenticated(false);
    setTopics(null);
  };

  const clearWelcomeMessage = () => {
    localStorage.removeItem('welcomeMessage');
    setWelcomeMessage(null);
  };

  
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const storedWelcomeMessage = localStorage.getItem('welcomeMessage');
    const storedTopics = localStorage.getItem('topics');
    

    if (storedUsername && token) {
      setUsername(storedUsername);
      setWelcomeMessage(storedWelcomeMessage);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      username,
      setUsername,
      isAuthenticated,
      login,
      localLogout,
      welcomeMessage,
      clearWelcomeMessage,
      shouldClearCode,
      setShouldClearCode,
      topics,
      setTopics
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};