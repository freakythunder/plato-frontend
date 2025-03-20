import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faLaptopCode, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { useProgress } from '../context/AppContext';
import posthog from 'posthog-js';

interface SidebarProps {
  isVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAllProblemSets, setPracticeMode } = useProgress();

  const handleHomeClick = () => {
    posthog.capture('navigation', {
      destination: 'home',
      source: location.pathname
    });
    navigate('/home');
  };

  const handlePracticeClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/dsa/allproblemsets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const problemset = await response.json();
      const allproblemset = problemset.data;
      setAllProblemSets(allproblemset);
      
      // Save current language state if needed
      const storedLanguage = localStorage.getItem('language');
      if (storedLanguage && storedLanguage !== 'DSA_Practice') {
        const currentTopics = JSON.parse(localStorage.getItem('topics') || '[]');
        const allTopics = JSON.parse(localStorage.getItem('allTopics') || '[]');
        
        const updatedAllTopics = allTopics.map(topic =>
          topic.language === storedLanguage ? { ...topic, topics: currentTopics } : topic
        );
        
        localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
      }
      
      // Set DSA practice mode
      localStorage.removeItem('topics');
      localStorage.setItem('language', 'DSA_Practice');
      
      posthog.capture('navigation', {
        destination: 'practice',
        source: location.pathname
      });
      
      navigate('/practice');
    } catch (error) {
      console.error('Error initiating DSA practice:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`${styles.sidebar} ${isVisible ? styles.visible : styles.hidden}`} aria-label="Learning Navigation">
      <div className={styles.sidebarContent}>
        <div 
          className={`${styles.sidebarItem} ${isActive('/home') ? styles.active : ''}`}
          onClick={handleHomeClick}
          title="Learning Dashboard"
        >
          <FontAwesomeIcon icon={faHome} className={styles.icon} />
          <span className={styles.label}>Home</span>
        </div>
        <div 
          className={`${styles.sidebarItem} ${isActive('/practice') ? styles.active : ''}`}
          
          title="Practice Coding"
        >
          <FontAwesomeIcon icon={faLaptopCode} className={styles.icon} />
          <span className={styles.label}>Practice</span>
          <span style={{ 
            fontSize: '0.7rem', 
            display: 'block', 
            color: '#999',
            fontFamily: "'sometype-mono', monospace" 
          }}>{"Coming Soon"}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
