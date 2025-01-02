import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ResizableContainer from './components/ResizableContainer';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  console.log("Test");
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App: React.FC = () => {
  const location = useLocation();
  return (
    <AuthProvider>
      <div className="appContainer">
        {/* Render Navbar only if the current path is not the home page */}
        {location.pathname !== '/' && <Navbar />}
        
        <Routes>
          <Route path="/" element={<HomePage />} />
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
        </Routes>
      </div>
    </AuthProvider>
  );
};

const MainApp = () => (
  <Router>
    <App />
  </Router>
);

export default MainApp;
