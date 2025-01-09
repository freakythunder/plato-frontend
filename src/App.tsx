import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ResizableContainer from './components/ResizableContainer';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import Syllabus from './components/syllabus/syllabus';
import { ProgressProvider } from './context/AppContext';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App: React.FC = () => {
  const location = useLocation();
  return (
    <ProgressProvider>
    <AuthProvider>
      <div className="appContainer">
        {/* Render Navbar only if the current path is not the home page */}
        {location.pathname !== '/' && <Navbar />}
        
        <Routes>
          <Route path="/" element={<HomePage />}  />
          <Route
            path="/main"
            element={
              <PrivateRoute>
                <div className="mainContainer">
                  <ResizableContainer />
                </div>
              </PrivateRoute>
            }
          />
          <Route path="syllabus" element={<Syllabus />}  />
        </Routes>
      </div>
    </AuthProvider>
    </ProgressProvider>
  );
};

const MainApp = () => (
  <Router>
    <App />
  </Router>
);

export default MainApp;
