import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../Styles/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getAuth, signOut } from "firebase/auth";
import { useProgress } from '../context/AppContext';
import posthog from 'posthog-js';

interface NavbarProps {
  onLogoClick: () => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'topic' | 'subtopic' | 'content';
}

const Navbar: React.FC<NavbarProps> = ({ onLogoClick }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { username, isAuthenticated, localLogout, imageurl } = useAuth();
  const auth = getAuth();
  const location = useLocation();
  const { currentSubtopic } = useProgress();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  
  // Check if current page is course generation or main
  const isCourseGenerationPage = location.pathname === '/course_generation';
  const isMainPage = location.pathname === '/main';
  
  // Function to determine the breadcrumbs based on the current subtopic
  useEffect(() => {
    if (isMainPage && currentSubtopic) {
      generateBreadcrumbs();
    }
  }, [isMainPage, currentSubtopic, location.pathname]);
  
  // Function to generate breadcrumbs from current subtopic
  const generateBreadcrumbs = () => {
    try {
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      const newBreadcrumbs: BreadcrumbItem[] = [];
      
      // Search for the current topic, subtopic, and content
      for (const topic of topics) {
        for (const subtopic of topic.subtopics) {
          // Check if this is a direct subtopic match (theory)
          if (subtopic.subtopicId === currentSubtopic) {
            // Add topic and subtopic breadcrumbs
            newBreadcrumbs.push({ 
              id: topic.id.toString(), 
              name: topic.name, 
              type: 'topic' 
            });
            newBreadcrumbs.push({ 
              id: subtopic.id.toString(), 
              name: subtopic.name, 
              type: 'subtopic' 
            });
            newBreadcrumbs.push({ 
              id: subtopic.subtopicId, 
              name: 'Theory', 
              type: 'content' 
            });
            break;
          }
          
          // Check challenges within subtopic
          if (subtopic.challenges) {
            for (const challenge of subtopic.challenges) {
              if (challenge.subtopicId === currentSubtopic) {
                // Add topic, subtopic, and challenge breadcrumbs
                newBreadcrumbs.push({ 
                  id: topic.id.toString(), 
                  name: topic.name, 
                  type: 'topic' 
                });
                newBreadcrumbs.push({ 
                  id: subtopic.id.toString(), 
                  name: subtopic.name, 
                  type: 'subtopic' 
                });
                newBreadcrumbs.push({ 
                  id: challenge.subtopicId, 
                  name: challenge.name, 
                  type: 'content' 
                });
                break;
              }
            }
          }
        }
      }
      
      // Update breadcrumbs state if we found a match
      if (newBreadcrumbs.length > 0) {
        setBreadcrumbs(newBreadcrumbs);
      }
    } catch (error) {
      console.error("Error generating breadcrumbs:", error);
    }
  };
  
  // Handle breadcrumb click navigation
  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    // Save which sections to expand when redirecting to course page
    if (breadcrumb.type === 'topic') {
      localStorage.setItem('expandedModule', breadcrumb.id);
      localStorage.removeItem('expandedSubtopic');
    } else if (breadcrumb.type === 'subtopic') {
      localStorage.setItem('expandedModule', breadcrumbs[0]?.id || '');
      localStorage.setItem('expandedSubtopic', breadcrumb.id);
    } else {
      // If clicking the content breadcrumb, don't navigate away
      return;
    }
    
    // Track the navigation with Posthog
    posthog.capture('breadcrumb_navigation', {
      breadcrumb_type: breadcrumb.type,
      breadcrumb_name: breadcrumb.name,
      from_page: location.pathname
    });
    
    // Navigate to course page
    navigate('/course');
  };
  
  const handleLogout = async () => {
    try {
      console.log('Attempting to log out');
  
      const alltopics = JSON.parse(localStorage.getItem('allTopics') || '[]');
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      
      if (alltopics && alltopics.length > 0 && topics && topics.length > 0) {
        const language = localStorage.getItem('language');
        const languageTopic = alltopics.find(topic => topic.language === language);
      
        if (languageTopic) {
          languageTopic.topics = topics;
        }
      }
       
      // Send logout request to backend with topics
      const response = await api.post('/auth/logout', { alltopics });
      console.log('Backend logout successful:', response);

      // Perform local logout actions to clear local storage and auth state
      localLogout();
      setIsMenuOpen(false);

      setTimeout(async () => {
        console.log('Executing Auth0 logout');
        await signOut(auth);
        navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error('Logout request failed:', error);

      // Perform local logout even if backend logout fails
      localLogout();
      setIsMenuOpen(false);

      await signOut(auth);
      navigate('/');
    }

    posthog.reset(true);
  };
  
  const topicsPresent = localStorage.getItem('topics') === null;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onLogoClick();
    posthog.capture('logo_clicked', {
      current_page: location.pathname
    });
  };

  const feedbackLink = "https://forms.gle/1PAjZiSpvLKdMYpb7";

  return (
    <nav className={styles.navbar} style={{ zIndex: 100 }}>
      <div className={styles.leftSection}>
        <div className={styles.title} onClick={handleLogoClick}>plato</div>
        
        {/* Breadcrumbs - only show on main page */}
        {isMainPage && breadcrumbs.length > 0 && (
          <div className={styles.breadcrumbs}>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.id}>
                <span 
                  className={`${styles.breadcrumbItem} ${breadcrumb.type === 'content' ? styles.currentBreadcrumb : ''}`}
                  onClick={() => handleBreadcrumbClick(breadcrumb)}
                >
                  {breadcrumb.name}
                </span>
                {index < breadcrumbs.length - 1 && (
                  <span className={styles.breadcrumbSeparator}>{'>'}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className={styles.navLinks}>
        <div className={styles.feedbackSection}>
          <span className={styles.feedbackText}>Got ideas to make Plato better?</span>
          <button
            className={styles.feedbackButton}
            onClick={() => window.open(feedbackLink, '_blank')}
          >
          Help Us
          </button>
        </div>
        {isAuthenticated ? (
          <div className={styles.userMenu}>
            <button onClick={toggleMenu} className={styles.userButton}>
              <img src={imageurl} alt="User Profile Picture" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
              }} />
            </button>
            {isMenuOpen && (
              <div className={styles.dropdown}>
                <span className={styles.username}>{username}</span>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;
