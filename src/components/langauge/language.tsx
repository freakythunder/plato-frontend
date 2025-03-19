import React, { useState, useEffect } from 'react';
import styles from './language.module.css';
import { useNavigate } from 'react-router-dom';
import posthog from 'posthog-js';
import { useProgress } from '../../context/AppContext';

const Language: React.FC = () => {
  const navigate = useNavigate();
  const [allTopics, setAllTopics] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [completions, setCompletions] = useState({});
  const { setAllProblemSets } = useProgress();

  // Track latest allTopics state using ref
  const allTopicsRef = React.useRef(allTopics);
  React.useEffect(() => {
    allTopicsRef.current = allTopics;
  }, [allTopics]);

  // Function to send topics to backend
  function sendTopicsToBackend(topics) {
    const url = `${process.env.REACT_APP_API_URL}/language/update-topics`;
    const token = localStorage.getItem("token");
    
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topics }),
        keepalive: true
      }).catch(e => {
        console.error("Error syncing topics:", e);
      });
    } catch (error) {
      console.error("Exception in sendTopicsToBackend:", error);
    }
  }

  // Enhanced unload handler with state preservation
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const currentTopics = allTopicsRef.current;
      if (currentTopics?.length > 0) {
        sendTopicsToBackend(currentTopics);
        localStorage.setItem('allTopics', JSON.stringify(currentTopics));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-save interval
  useEffect(() => {
    if (!(window as any)._autoSaveInterval) {
      (window as any)._autoSaveInterval = setInterval(() => {
        const topics = JSON.parse(localStorage.getItem('allTopics') || '[]');
        if (topics.length > 0) {
          sendTopicsToBackend(topics);
        }
      }, 20000);
    }

    return () => {
      clearInterval((window as any)._autoSaveInterval);
      (window as any)._autoSaveInterval = null;
    };
  }, []);

  // Calculate completion percentage for courses
  const calculateCompletion = (topics) => {
    if (!topics || !Array.isArray(topics)) return { completed: 0, total: 0 };
    
    let totalWeight = 0;
    let completedWeight = 0;

    topics.forEach((topic) => {
      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        topic.subtopics.forEach((subtopic) => {
          totalWeight += 1;
          if (subtopic.completed) {
            completedWeight += 1;
          }
        });
      }
    });

    return { completed: completedWeight, total: totalWeight };
  };
  
  // New function to calculate progress using NewPage.tsx logic
  const calculateDetailedProgress = (topics) => {
    if (!topics || !Array.isArray(topics)) return 0;
    
    let totalItems = 0;
    let completedItems = 0;
    
    topics.forEach(topic => {
      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        topic.subtopics.forEach(subtopic => {
          // Count challenges
          if (subtopic.challenges && Array.isArray(subtopic.challenges)) {
            totalItems += subtopic.challenges.length;
            completedItems += subtopic.challenges.filter(c => c.completed).length;
          }
          
          // Count theory items
          if (subtopic.theory && Array.isArray(subtopic.theory)) {
            totalItems += subtopic.theory.length;
            completedItems += subtopic.theory.filter(t => t.completed).length;
          }
        });
      }
    });
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Update completions when allTopics changes
  const updateCompletions = (topics) => {
    if (!topics || !Array.isArray(topics)) return;
    
    const newCompletions = topics.reduce((acc, topic) => {
      if (!topic || !topic.topics) return acc;
      
      // Use original calculation for subtopic count display
      const completion = calculateCompletion(topic.topics);
      
      // Use new detailed calculation for progress bar percentage
      const percentageCompletion = calculateDetailedProgress(topic.topics);
      
      acc[topic.language] = { 
        completed: completion.completed, 
        total: completion.total, 
        percentage: percentageCompletion 
      };
      return acc;
    }, {});
    
    setCompletions(newCompletions);
  };

  // Original function - keep it for consistent display of subtopic counts
  const calculateCompletionPercentage = (completed, total) => {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  // Load initial data
  useEffect(() => {
    console.log('[Initial Load] Starting data initialization');
    
    const storedAllTopics = localStorage.getItem('allTopics');
    const storedLanguage = localStorage.getItem('language');
    
    if (storedAllTopics) {
      let parsedTopics = JSON.parse(storedAllTopics);
      console.log('[Initial Load] Parsed allTopics:', parsedTopics);

      // Synchronization logic for current language's topics
      if (storedLanguage && storedLanguage !== 'DSA_Practice') {
        console.log(`[Initial Load] Checking topic synchronization for ${storedLanguage}`);
        
        const currentTopics = JSON.parse(localStorage.getItem('topics') || '[]');
        console.log('[Initial Load] Current topics from storage:', currentTopics);

        const languageIndex = parsedTopics.findIndex(t => t.language === storedLanguage);
        console.log('[Initial Load] Language index in allTopics:', languageIndex);

        if (languageIndex !== -1) {
          const existingTopics = parsedTopics[languageIndex].topics;
          console.log('[Initial Load] Existing topics in allTopics:', existingTopics);
          
          // Compare topics using stringify for deep equality check
          if (JSON.stringify(existingTopics) !== JSON.stringify(currentTopics)) {
            console.log('[Initial Load] Topics mismatch detected, updating allTopics');
            parsedTopics[languageIndex] = { 
              ...parsedTopics[languageIndex], 
              topics: currentTopics 
            };
            
            localStorage.setItem('allTopics', JSON.stringify(parsedTopics));
          }
        }
      }

      // Update state with (possibly modified) allTopics
      setAllTopics(parsedTopics);
      updateCompletions(parsedTopics);
      console.log('[Initial Load] Updated state with allTopics');

      // Set courses from parsed topics
      const courses = parsedTopics// Filter out DSA if present in allTopics
        .map(topic => topic.language);
      setMyCourses(courses);
      
      // If no courses, redirect to course generation
      if (courses.length === 0) {
        console.log('[Initial Load] No courses found, redirecting to course generation');
        navigate('/course_generation');
      }
    } else {
      // No topics found, redirect to course generation
      console.log('[Initial Load] No allTopics found, redirecting to course generation');
      navigate('/course_generation');
    }
  }, [navigate]);

  // Sync allTopics with local storage and update myCourses when allTopics changes
  useEffect(() => {
    if (allTopics && allTopics.length > 0) {
      localStorage.setItem('allTopics', JSON.stringify(allTopics));
      updateCompletions(allTopics);
      
      // Update myCourses whenever allTopics changes - this was missing
      const courses = allTopics
        .map(topic => topic.language);
      setMyCourses(courses);
      
      console.log('[allTopics updated] Courses refreshed:', courses);
    }
  }, [allTopics]);

  // Handle language selection with proper navigation state
  const handleLanguageClick = async (language) => {
    const storedLanguage = localStorage.getItem('language');
    
    if (storedLanguage === language) {
      // Navigate to course page instead of main
      navigate('/course');
      return;
    }

    // Update allTopics with current progress before switching 
    if (storedLanguage && storedLanguage !== 'DSA_Practice') {
      try {
        const currentTopics = JSON.parse(localStorage.getItem('topics') || '[]');
        
        // Create a new array rather than mutating the existing one
        const updatedAllTopics = allTopics.map(topic =>
          topic.language === storedLanguage ? { ...topic, topics: currentTopics } : topic
        );
        
        setAllTopics(updatedAllTopics);
        localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
        
        console.log('[Language Switch] Updated allTopics with current progress');
      } catch (error) {
        console.error('Error updating topics before language switch:', error);
      }
    }
    
    localStorage.setItem('language', language);

    try {
      const selectedTopic = allTopics.find(topic => topic.language === language);
      if (selectedTopic) {
        posthog.capture('course_continued', {
          Language: language
        });
        localStorage.setItem('topics', JSON.stringify(selectedTopic.topics));
      }
      
      // Navigate to course page instead of main
      navigate('/course');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle new course generation
  const handleNewCourseClick = () => {
    posthog.capture('new_course_clicked', {
      from_page: 'home'
    });
    // Skip to step 2 of course generation since user already has courses
    localStorage.setItem('courseGenStep', '2');
    navigate('/course_generation');
  };

  // LanguageLogo component
  const LanguageLogo = ({ language }) => {
    const logoUrls = {
      Python: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
      Java: 'https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg',
      JavaScript: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
      'C++': 'https://upload.wikimedia.org/wikipedia/commons/1/18/ISO_C%2B%2B_Logo.svg',
      DSA: 'https://cdn-icons-png.flaticon.com/512/2103/2103652.png'
    };

    return (
      <img
        src={logoUrls[language]}
        alt={`${language} logo`}
        style={{ width: 50, height: 60 }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.style.display = 'none';
        }}
      />
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>My Courses</h1>
        <button 
          className={styles.newCourseButton}
          onClick={handleNewCourseClick}
        >
          + Create New Course
        </button>
      </div>
      <div className={styles.innerWrapper}>
        <div className={styles.coursesContainer}>
          <div className={styles.card}>
            {myCourses.length > 0 ? (
              <div className={styles.gridContainer}>
                {myCourses.map(course => (
                  <div key={course} className={styles.languageCard}
                    onClick={() => handleLanguageClick(course)}>
                    <LanguageLogo language={course} />
                    <h3 className={styles.cardTitle}>Learning {course}</h3>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${completions[course] ? completions[course].percentage : 0}%`,
                          backgroundColor: '#4CAF50',
                          height: '100%',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>
                    <span className={styles.completionText}>
                      {completions[course] ? <span>You've completed <span className={styles.progressPercentage}>{completions[course].percentage}%</span></span> : '0% Completed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>You don't have any courses yet. Click "New Course" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Language;