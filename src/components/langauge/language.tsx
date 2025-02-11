import React, { useState, useEffect } from 'react';
import styles from './language.module.css';
import { useNavigate } from 'react-router-dom';
import posthog from 'posthog-js'
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
 
  function sendTopicsToBackend(topics) {
   fetch(`${process.env.REACT_APP_API_URL}/language/update-topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
        body: JSON.stringify({ topics })
    })
    .then(response => response.json())
    .then(data => console.log('Topics sent successfully:', data))
    .catch(error => console.error('Error sending topics:', error));
}

// Listen for tab close event
window.addEventListener('beforeunload', function(event) {
    // Get topics from local storage
    const topics = JSON.parse(localStorage.getItem('allTopics'));

    if (topics.length > 0) {
        // Send topics to the backend
        sendTopicsToBackend(topics);
    }
});
  // Load initial data
  useEffect(() => {
    const storedAllTopics = localStorage.getItem('allTopics');
    
    if (storedAllTopics) {
      const parsedTopics = JSON.parse(storedAllTopics);
      setAllTopics(parsedTopics);
      updateCompletions(parsedTopics);

      const courses = parsedTopics.map(topic => topic.language);
      setMyCourses(courses);

      const others = ['Python', 'Java', 'JavaScript', 'C++']
        .filter(lang => !courses.includes(lang));
      setOtherLanguages(others);
    } else {
      setOtherLanguages(['Python', 'Java', 'JavaScript', 'C++']);
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
      navigate('/main');
      return;
    }

    // Update allTopics with current progress before switching
    if (storedLanguage) {
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
      navigate('/main');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // LanguageLogo component remains unchanged
  const LanguageLogo = ({ language }) => {
    const logoUrls = {
      Python: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
      Java: 'https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg',
      JavaScript: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
      'C++': 'https://upload.wikimedia.org/wikipedia/commons/1/18/ISO_C%2B%2B_Logo.svg'
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
      <div className={styles.card}>
        {myCourses.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <h1>Welcome to Plato, pick a language to get started!</h1>
            <div className={styles.gridContainer}>
              {['Python', 'Java', 'JavaScript', 'C++'].map(language => (
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
                <p className={styles.footerText}>Want to start learning another language?</p>
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
  );
};

export default Language;