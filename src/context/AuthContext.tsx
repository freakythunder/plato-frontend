// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/firebase';
import { setTokenWithTimestamp, isLocalTokenValid } from '../utils/tokenUtils';
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
  currentUser: any;
  imageurl : string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [shouldClearCode, setShouldClearCode] = useState<boolean>(false); // Initialize the new variable
  const [currentUser, setCurrentUser] = useState(null);
  const [imageurl, setImageurl] = useState<string | null>(null);  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        user.getIdToken().then((token) => {
          setTokenWithTimestamp(token); // Use utility function to store token with timestamp
          setImageurl(user.photoURL);
          setIsAuthenticated(true);
          console.log("user from authcontext : ", user);
        });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenTimestamp');
        setIsAuthenticated(false);
      }
    });
  }, []);
     const login = (username: string, token: string, message: string) => {
    
    localStorage.setItem('username', username);
    setTokenWithTimestamp(token); // Use utility function to store token with timestamp
    
    const trimmedMessage = message.trim().toLowerCase();
   

    if (trimmedMessage === 'user registered') {
      localStorage.setItem('IsNewUser', 'true'); // Store new user status
    } else {
      localStorage.setItem('IsNewUser', 'false'); // Store returning user status
      
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
  };

  const clearWelcomeMessage = () => {
    localStorage.removeItem('welcomeMessage');
    setWelcomeMessage(null);
  };    useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const storedTopics = localStorage.getItem('topics');
    
    // Check if token is valid (not expired)
    if (storedUsername && token && isLocalTokenValid()) {
      setUsername(storedUsername);
      setIsAuthenticated(true);
    } else {
      // Clear invalid authentication data
      if (token && !isLocalTokenValid()) {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenTimestamp');
        localStorage.removeItem('username');
      }
      
      // Ensure authentication state is consistent with localStorage
      setIsAuthenticated(false);
      setUsername(null);
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
      currentUser,
      imageurl
    }}>
      {children}
    </AuthContext.Provider>
  );
};