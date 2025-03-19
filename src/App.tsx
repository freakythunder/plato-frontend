import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ResizableContainer from './components/ResizableContainer';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import { ProgressProvider } from './context/AppContext';
import 'firebaseui/dist/firebaseui.css';
import Language from './components/langauge/language';
import Practice from './components/practice/practice';
import CourseGeneration from './components/course_generation/course_generation';
import Sidebar from './components/Sidebar';
import NewPage from './pages copy/NewPage';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/" />;
};

// Add a redirect component to handle login navigation
const LoginRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home');
    }
  }, [navigate]);
  
  return null;
};

const App: React.FC = () => {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Improved logic for sidebar visibility
  useEffect(() => {
    // Hide sidebar on login page
    if (location.pathname === '/') {
      setSidebarVisible(false);
      return;
    }
    
    // Hide sidebar on main page by default
    if (location.pathname === '/main') {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [location.pathname]);
  
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  // Main layout class based on route
  const getMainContentClass = () => {
    if (location.pathname === '/') return '';
    if (location.pathname === '/main') return 'mainContent';
    return `mainContent ${sidebarVisible ? 'withSidebar' : ''}`;
  };

  return (
    <ProgressProvider>
      <AuthProvider>
        <div className="appContainer">
          {/* Render Navbar only if the current path is not the login page */}
          {location.pathname !== '/' && <Navbar onLogoClick={toggleSidebar} />}
          
          {/* Sidebar component - only visible on certain pages */}
          {location.pathname !== '/' && <Sidebar isVisible={sidebarVisible} />}
          
          {/* Main content with proper class handling */}
          <div className={getMainContentClass()}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login-redirect" element={<LoginRedirect />} />
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
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Language/>
                  </PrivateRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <PrivateRoute>
                    <Practice/>
                  </PrivateRoute>
                }
              />
              <Route
                path="/course_generation"
                element={
                  <PrivateRoute>
                    <CourseGeneration/>
                  </PrivateRoute>
                }
              />
              <Route
                path="/course"
                element={
                  <PrivateRoute>
                    <NewPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
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
