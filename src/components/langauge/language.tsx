import React, { useState, useEffect } from 'react';
import styles from './language.module.css';
import { useNavigate } from 'react-router-dom';
import posthog from 'posthog-js';
import { useProgress } from '../../context/AppContext';
posthog.init('phc_SkoWOGNlQvwgXkAqlKWmYT6l0JStbH2Dpeh5dtY1b2N', { api_host: 'https://us.i.posthog.com' })

const calculateCompletion = (topics) => {
  let totalWeight = 0;
  let completedWeight = 0;

  topics.forEach((topic) => {
    topic.subtopics.forEach((subtopic) => {
      totalWeight += 1;
      if (subtopic.completed) {
        completedWeight += 1;
      }
    });
  });

  return { completed: completedWeight, total: totalWeight };
};



const Language: React.FC = () => {
  const navigate = useNavigate();
  const [allTopics, setAllTopics] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [otherLanguages, setOtherLanguages] = useState([]);
  const [completions, setCompletions] = useState({});
  const {setAllProblemSets} = useProgress();

// Track latest allTopics state using ref
const allTopicsRef = React.useRef(allTopics);
React.useEffect(() => {
  allTopicsRef.current = allTopics;
}, [allTopics]);

// Revised backend sync with beacon API and fallback
function sendTopicsToBackend(topics) {
  
  const url = `${process.env.REACT_APP_API_URL}/language/update-topics`;
  const token = localStorage.getItem("token");
  
  try {
    // Primary method: fetch with keepalive and headers
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topics }),
      keepalive: true // Ensures request continues during unload
    }).then(() => {
     
    }).catch(e => {
      
    });
  } catch (error) {
    
  }
}

// Enhanced unload handler with state preservation
window.addEventListener('beforeunload', (event) => {
 
  
  // Get current language and latest topics
  const currentLanguage = localStorage.getItem('language');
  const currentTopics = allTopicsRef.current;
  


  // Force sync before unload
  if (currentTopics?.length > 0) {

    sendTopicsToBackend(currentTopics);
    
    // Ensure localStorage matches current state
    localStorage.setItem('allTopics', JSON.stringify(currentTopics));

  }
});


// Modified interval implementation in language.tsx
useEffect(() => {
  // Only set the interval if it hasn’t been set already
  if (!(window as any)._autoSaveInterval) {
    (window as any)._autoSaveInterval = setInterval(() => {
      const topics = JSON.parse(localStorage.getItem('allTopics') || '[]');
      if (topics.length > 0) {
        sendTopicsToBackend(topics);
      }
    }, 20000);
  }

  // Cleanup: clear the interval on component unmount.
  return () => {
    clearInterval((window as any)._autoSaveInterval);
    (window as any)._autoSaveInterval = null;
  };
}, []); // Empty dependency array ensures it runs only once

  // Load initial data
  useEffect(() => {
  console.log('[Initial Load] Starting data initialization');
  
  const storedAllTopics = localStorage.getItem('allTopics');
  const storedLanguage = localStorage.getItem('language');
  
  console.log('[Initial Load] Stored language:', storedLanguage);
  console.log('[Initial Load] Raw allTopics from storage:', storedAllTopics);

  if (storedAllTopics) {
    let parsedTopics = JSON.parse(storedAllTopics);
    console.log('[Initial Load] Parsed allTopics:', parsedTopics);

    // Synchronization logic for current language's topics
    if (storedLanguage) {
      console.log(`[Initial Load] Checking topic synchronization for ${storedLanguage}`);
      
      const currentTopics = JSON.parse(localStorage.getItem('topics')) || [];
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
          
          console.log('[Initial Load] Updated allTopics:', parsedTopics);
          localStorage.setItem('allTopics', JSON.stringify(parsedTopics));
          console.log("parsed topics : ",parsedTopics);
          console.log('[Initial Load] Saved updated allTopics to storage');
        }
        else {
          console.log('[Initial Load] Topics are synchronized, no update needed');
        }
      }
      else {
        if(storedLanguage !== 'DSA_Practice'){
          console.warn('[Initial Load] Stored language not found in allTopics');
          const newLanguageEntry = {
          language: storedLanguage,
          topics: currentTopics,
        };
    
        // Add to parsedTopics and update storage
        parsedTopics = [...parsedTopics, newLanguageEntry];
        localStorage.setItem('allTopics', JSON.stringify(parsedTopics));
        }
        
        
      }
    }

    // Update state with (possibly modified) allTopics
    setAllTopics(parsedTopics);
    updateCompletions(parsedTopics);
    console.log('[Initial Load] Updated state with allTopics');

      const courses = parsedTopics.map(topic => topic.language);
      setMyCourses(courses);

      const others = ['Python', 'Java', 'JavaScript', 'C++','DSA']
        .filter(lang => !courses.includes(lang));
      setOtherLanguages(others);
    } else {
      setOtherLanguages(['Python', 'Java', 'JavaScript', 'C++','DSA']);
    }
  }, []);



  // Update completions when allTopics changes
  const updateCompletions = (topics) => {
    const newCompletions = topics.reduce((acc, topic) => {
      const completion = calculateCompletion(topic.topics);
      const percentageCompletion = calculateCompletionPercentage(completion.completed, completion.total);
      acc[topic.language] = { completed: completion.completed, total: completion.total, percentage: percentageCompletion };
      return acc;
    }, {});
    setCompletions(newCompletions);
  };

  const calculateCompletionPercentage = (completed, total) => {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  // Sync allTopics with local storage
  useEffect(() => {
    if (allTopics.length > 0) {
      localStorage.setItem('allTopics', JSON.stringify(allTopics));
      updateCompletions(allTopics);
    }
  }, [allTopics]);

  // Handle language selection
  const handleLanguageClick = async (language) => {
    const storedLanguage = localStorage.getItem('language');
    
    if (storedLanguage === language) {
      navigate('/main' , {state :{refresh : true}});
      return;
    }

    // Update allTopics with current progress before switching 
    if (storedLanguage && storedLanguage !== 'DSA_Practice') {
      const currentTopics = JSON.parse(localStorage.getItem('topics')) || [];
      const updatedAllTopics = allTopics.map(topic =>
        topic.language === storedLanguage ? { ...topic, topics: currentTopics } : topic
      );
      setAllTopics(updatedAllTopics);
      localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
      updateCompletions(updatedAllTopics);
    }
    
    localStorage.setItem('language', language);

    try {
      if (myCourses.includes(language)) {

        posthog.capture('course_continued' , {
          Language : language
        });

        const selectedTopic = allTopics.find(topic => topic.language === language);
        if (selectedTopic) {
          localStorage.setItem('topics', JSON.stringify(selectedTopic.topics));
        }
      } else {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/language/select`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ language }),
        });

        if (!response.ok) throw new Error('Failed to fetch topics');
        posthog.capture('started_new_course' ,{
          Language : language
        });
        const { data } = await response.json();
        if (Array.isArray(data)) {
          const newTopics = data.find(t => t.language === language);
          if (newTopics) {
            const updatedAllTopics = [...allTopics, newTopics];
            setAllTopics(updatedAllTopics);
            localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
            updateCompletions(updatedAllTopics);
            localStorage.setItem('topics', JSON.stringify(newTopics.topics));
          }
        }
      }
      navigate('/main' , {state :{refresh : true}});
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // New handler for DSA practice click
  const handleDSAPracticeClick = async () => {
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
      const storedLanguage = localStorage.getItem('language');
      const currentTopics = JSON.parse(localStorage.getItem('topics')) || [];
      const updatedAllTopics = allTopics.map(topic =>
        topic.language === storedLanguage ? { ...topic, topics: currentTopics } : topic
      );
      setAllTopics(updatedAllTopics);
      localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
      updateCompletions(updatedAllTopics);
      
      localStorage.removeItem('topics');
      localStorage.setItem('language', 'DSA_Practice');
      navigate('/practice');
    } catch (error) {
      console.error('Error initiating DSA practice:', error);
    }
  };

  // LanguageLogo component remains unchanged
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
      <div className={styles.innerWrapper}>
        <div className={styles.coursesContainer}>
          <div className={styles.card}>
            {myCourses.length === 0 ? (
              <div className={styles.welcomeMessage}>
                <h1>Welcome to Plato, pick a Course to get started!</h1>
                <div className={styles.gridContainer}>
                  {['Python', 'Java', 'JavaScript', 'C++','DSA'].map(language => (
                    <div key={language} className={styles.languageCard}
                      onClick={() => handleLanguageClick(language)}>
                      <LanguageLogo language={language} />
                      <h3 className={styles.cardTitle}>{language}</h3>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <h1 className={styles.title}>My Courses</h1>
                </div>
                <div className={styles.gridContainer}>
                  {myCourses.map(course => (
                    <div key={course} className={styles.languageCard}
                      onClick={() => handleLanguageClick(course)}>
                      <LanguageLogo language={course} />
                      <h3 className={styles.cardTitle}>Learning {course}</h3>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill}
                          style={{ width: `${completions[course] ? completions[course].percentage : 0}%` }} />
                      </div>
                      <span className={styles.completionText}>
                        {completions[course] ? `${completions[course].completed}/${completions[course].total} subtopics completed` : '0% Completed'}
                      </span>
                    </div>
                  ))}
                </div>
                {otherLanguages.length > 0 && (
                  <div className={styles.footer}>
                    <p className={styles.footerText}>Want to learn something else?</p>
                    <div className={styles.gridContainer}>
                      {otherLanguages.map(language => (
                        <div key={language} className={styles.languageCard}
                          onClick={() => handleLanguageClick(language)}>
                          <LanguageLogo language={language} />
                          <h3 className={styles.cardTitle}>{language}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className={styles.dsaContainer} onClick={handleDSAPracticeClick}>
          <div className={styles.dsaCard} >
            <LanguageLogo language="DSA" />
            <h3 className={styles.cardTitle}>DSA Practice Arena</h3>
            <p className={styles.dsaCardDescription}>Practice data structures and algorithms</p>
            <div className={styles.comingSoonBadge}>Start Practicing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Language;