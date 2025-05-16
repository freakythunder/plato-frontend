import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './course_generation.module.css';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/AppContext';
import posthog from 'posthog-js';

const CourseGeneration: React.FC = () => {
  const navigate = useNavigate();
  const { username, isAuthenticated } = useAuth();
  const { setAllTopics } = useProgress();
    // Additional authentication check
  useEffect(() => {
    // We need to import the utility here
    const isLocalTokenValid = () => {
      const token = localStorage.getItem('token');
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      
      if (!token || !tokenTimestamp) {
        return false;
      }
      
      const now = Date.now();
      const timestamp = parseInt(tokenTimestamp, 10);
      const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
      
      // If token is older than 1 hour, consider it expired
      return now - timestamp < ONE_HOUR;
    };

    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token || !isLocalTokenValid()) {
      console.log("Unauthorized access attempt to course_generation page");
      // Clear any potentially invalid authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('tokenTimestamp');
      localStorage.removeItem('username');
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState('');
  const [expertise, setExpertise] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [loadingMessage, setLoadingMessage] = useState(''); // For rotating messages
  // New state variables for progress bar
  const [progress, setProgress] = useState(0);
  const [stopAtPercentage, setStopAtPercentage] = useState(0);
  const [backendResponseReceived, setBackendResponseReceived] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Total number of steps in the process
  const totalSteps = 4;

  // Loading messages for the loading screen
  const loadingMessages = [
    "Hold on… I’m creating a course for you…",
    "Initializing your coding journey variables...",
    "Depending on your choices it may tak 2-10 minutes to generate your course...",
    "Recursively building your knowledge tree...",
    "Rational things make it more understandable",
    "may need to wait for 3 to 7 minutes...",
  ];

  // Effect to rotate loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[randomIndex]);
    }, 3000); // Change message every 3 seconds
    
    // Set initial message
    setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load saved state from localStorage on initial render
  useEffect(() => {
    const savedStep = localStorage.getItem('courseGenStep');
    const savedGoal = localStorage.getItem('courseGenGoal');
    const savedLanguage = localStorage.getItem('courseGenLanguage');
    const savedExpertise = localStorage.getItem('courseGenExpertise');

    if (savedStep) setCurrentStep(parseInt(savedStep));
    if (savedGoal) setGoal(savedGoal);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedExpertise) setExpertise(JSON.parse(savedExpertise));
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('courseGenStep', currentStep.toString());
    if (goal) localStorage.setItem('courseGenGoal', goal);
    if (language) localStorage.setItem('courseGenLanguage', language);
    if (Object.keys(expertise).length > 0) {
      localStorage.setItem('courseGenExpertise', JSON.stringify(expertise));
    }
  }, [currentStep, goal, language, expertise]);

  // Concepts for different languages/goals
  const conceptsByType = {
    'language': {
      'Python': [
        'Basics of Python', 
        'Variables, Data Types, and Constants', 
        'Input and Output', 
        'Operators', 
        'Control Flow', 
        'Loops', 
        'Strings', 
        'Lists', 
        'Tuples and Sets', 
        'Dictionaries', 
        'Functions', 
        'Object-Oriented Programming (OOP)', 
        'Modules and Packages'
      ],
      'C++': [
        'Basics of C++', 
        'Variables, Data Types, and Constants', 
        'Operators', 
        'Control Flow', 
        'Loops', 
        'Arrays and Strings', 
        'Pointers', 
        'Functions', 
        'Object-Oriented Programming (OOP)', 
        'Standard Template Library (STL)'
      ],
      'JavaScript': [
        'Variables & Data Types', 
        'Operators', 
        'Control Structures (if-else, switch statements)', 
        'Loops', 
        'Arrays', 
        'Objects', 
        'Functions'
      ],
      'Java': [
        'Introduction to Java', 
        'Basics of Java', 
        'Operators', 
        'Control Flow', 
        'Arrays', 
        'Strings', 
        'Object-Oriented Programming (OOP)', 
        'Methods', 
        'Exception Handling', 
        'Collections Framework', 
        'Multithreading', 
        'Java 8 Features'
      ]
    },
    'dsa': [
      'Introduction to DSA',
      'Array Techniques',
      'String Manipulation',
      'Linked Lists',
      'Stacks and Queues',
      'Recursion and Backtracking',
      'Trees',
      'Hashing and Hash Tables',
      'Sorting and Searching Algorithms',
      'Graphs',
      'Greedy Algorithms',
      'Dynamic Programming',
      'Advanced Data Structures',
      'Bit Manipulation and Maths',
      'Advanced Problem-Solving Techniques'
    ]
  };

  // Get concepts based on user selection
  const getRelevantConcepts = () => {
    if (goal === 'language' && language) {
      return conceptsByType.language[language] || [];
    } else if (goal === 'dsa') {
      return conceptsByType.dsa;
    }
    return [];
  };

  // Progress bar timer effect
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setBackendResponseReceived(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Generate random stopping point between 94-99%
    const randomStop = Math.floor(Math.random() * 6) + 94;
    setStopAtPercentage(randomStop);
    
    // Calculate interval to reach the stopping point in 4 minutes
    // This allows the remaining progress to complete after backend response
    const intervalTime = (4 * 60 * 1000) / randomStop;
    
    timerRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= stopAtPercentage && !backendResponseReceived) {
          // Stop at the random percentage until backend responds
          return stopAtPercentage;
        } else if (prevProgress >= 100) {
          // Clear interval when reaching 100%
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 100;
        } else {
          // Normal progress increase
          return prevProgress + 1;
        }
      });
    }, intervalTime);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, backendResponseReceived, stopAtPercentage]);

  const handleReadyClick = () => {
    setCurrentStep(2);
    posthog.capture('course_generation_started', {
      step: 'welcome'
    });
  };

  const handleGoalSelection = (selectedGoal: string) => {
    setGoal(selectedGoal);
    
    if (selectedGoal === 'dsa') {
      // For DSA, automatically set language to C++ and skip to step 4
      setLanguage('C++');
      setCurrentStep(4);
    } else {
      // For language learning, go to step 3 to select a language
      setCurrentStep(3);
    }
    
    posthog.capture('course_generation_goal_selected', {
      goal: selectedGoal
    });
  };

  const handleLanguageSelection = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setCurrentStep(4);
    posthog.capture('course_generation_language_selected', {
      goal: goal,
      language: selectedLanguage
    });
  };

  const handleExpertiseChange = (concept: string, level: string) => {
    setExpertise(prev => ({ ...prev, [concept]: level }));
  };

  const handleGenerateCourse = async () => {
    try {
      setIsLoading(true); // Start loading
      
      posthog.capture('course_generation_complete', {
        goal: goal,
        language: language,
        expertise_levels: expertise
      });
      
      // Sort the expertise topics by knowledge level
      // (expert/knows very well -> familiar -> beginner)
      const expertiseOrder = { "expert": 1, "familiar": 2, "beginner": 3 };
      const sortedExpertiseTopics = Object.entries(expertise).sort((a, b) => {
        return expertiseOrder[a[1]] - expertiseOrder[b[1]];
      });
      
      // Create an ordered expertise object
      const orderedExpertise = Object.fromEntries(sortedExpertiseTopics);
      
      const token = localStorage.getItem("token");
      let referencelang = goal === 'dsa' ? 'C++' : language;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/language/generate-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({ 
          goal, 
          language: goal === 'dsa' ? 'C++' : language, 
          expertise: orderedExpertise // Use the ordered expertise object
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate course');
          // Get the response as text first
    const responseText = await response.text();
    
    // Parse the last JSON object in the response
    // (ignoring the keep-alive JSON packets)
    let finalData;
    try {
      // Split by newlines and find the last non-empty JSON object
      const jsonChunks = responseText.split('\n\n')
                            .filter(chunk => chunk.trim() !== '');
      
      const lastJsonChunk = jsonChunks.reduce((lastValid, current) => {
        try {
          const parsed = JSON.parse(current);
          // Only consider it if it's not a keep-alive packet
          if (!parsed.keepAlive) {
            return current;
          }
          return lastValid;
        } catch (e) {
          return lastValid;
        }
      }, jsonChunks[jsonChunks.length - 1]);
      
      finalData = JSON.parse(lastJsonChunk);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      // Fallback to parsing the entire response
      finalData = JSON.parse(responseText);
    }
    
      // Mark that backend response has been received to complete the progress bar
      setBackendResponseReceived(true);
      
      const dat = finalData;
      const data = dat.data;
      
      // The courseLanguage we're looking for
      const courseLanguage = goal.toLowerCase() === 'dsa' ? 'DSA' : language;
      
      // Find the topics for the selected language from the array
      const matchingLanguageData = Array.isArray(data) && 
        data.find(item => item.language === courseLanguage);
      
      if (matchingLanguageData && matchingLanguageData.topics) {
        const newTopics = {
          language: courseLanguage,
          topics: matchingLanguageData.topics
        };
        
        const existingTopics = JSON.parse(localStorage.getItem('allTopics') || '[]');
        
        // Check if this language already exists in topics and remove it to avoid duplicates
        const filteredTopics = existingTopics.filter(topic => topic.language !== courseLanguage);
        const updatedAllTopics = [...filteredTopics, newTopics];
        
        setAllTopics(updatedAllTopics);
        localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
        localStorage.setItem('language', referencelang);
        localStorage.setItem('topics', JSON.stringify(matchingLanguageData.topics));
        localStorage.setItem('currentCourse', courseLanguage);
        
        // Clear saved course generation progress
        localStorage.removeItem('courseGenStep');
        localStorage.removeItem('courseGenGoal');
        localStorage.removeItem('courseGenLanguage');
        localStorage.removeItem('courseGenExpertise');
        
        // Also clear resume learning data for the fresh course
        localStorage.removeItem('lastVisitedSubtopic');
        localStorage.removeItem('lastVisitedType');
        localStorage.removeItem('currentSubtopic');
        
        // Set flag to indicate a new course was just generated
        localStorage.setItem('newCourseGenerated', 'true');
        
        // Quick progress to 100% before navigating
        const completeProgress = () => {
          // Start a fast timer to quickly get to 100%
          const fastInterval = setInterval(() => {
            setProgress((prevProgress) => {
              if (prevProgress >= 100) {
                clearInterval(fastInterval);
                return 100;
              }
              return prevProgress + 2; // Increment quickly by 2% each time
            });
          }, 25); // Update every 25ms for quick progress
          
          // Give time for progress bar to reach 100% before navigating
          setTimeout(() => {
            clearInterval(fastInterval);
            // Navigate to course page instead of main page
            navigate('/course');
          }, 500); // 500ms delay to ensure progress bar completes
        };
        
        // If progress is already >= stopAtPercentage, complete the progress
        completeProgress();
        
      } else {
        throw new Error('No matching topics found for the selected language');
      }
    } catch (error) {
      console.error('Error generating course:', error);
      setIsLoading(false); // Stop loading on error
    }
  };

  // Improve canProceedToNext to be more strict about validations
  const canProceedToNext = () => {
    switch(currentStep) {
      case 1: // Welcome step
        return true; // No choice needed here, just the "I'm ready" button
      case 2: // Goal selection
        return goal !== '';
      case 3: // Language selection
        // Only allow proceeding if language is selected
        // If goal is 'dsa', language is auto-set to C++
        return goal === 'dsa' || (goal === 'language' && language !== '');
      case 4: // Expertise selection
        const concepts = getRelevantConcepts();
        // Ensure ALL concepts have an expertise level chosen
        return concepts.length > 0 && concepts.every(concept => expertise[concept] !== undefined);
      default:
        return false;
    }
  };

  // Update handleNextStep to respect the validation
  const handleNextStep = () => {
    // Only proceed if allowed
    if (canProceedToNext()) {
      if (currentStep === 2 && goal === 'dsa') {
        // Skip step 3 (language selection) for DSA path
        setCurrentStep(4);
        posthog.capture('course_generation_next_step', {
          from_step: currentStep,
          to_step: 4
        });
      } else {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        posthog.capture('course_generation_next_step', {
          from_step: currentStep,
          to_step: currentStep + 1
        });
      }
    }
  };

  const handlePrevStep = () => {
    // Special case: if at step 4 with goal='dsa', go back to step 2 since we skipped step 3
    if (currentStep === 4 && goal === 'dsa') {
      setCurrentStep(2);
      posthog.capture('course_generation_prev_step', {
        from_step: currentStep,
        to_step: 2
      });
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
      posthog.capture('course_generation_prev_step', {
        from_step: currentStep,
        to_step: currentStep - 1
      });
    }
  };

  // Render the expertise step with sticky header and scrollable content
  const renderExpertiseStep = () => {
    const concepts = getRelevantConcepts();
    return (
      <div className={styles.expertiseStep}>
        <div className={styles.expertiseHeader}>
          <h2>Rate your expertise level for {goal === 'dsa' ? 'DSA' : language} concepts</h2>
        </div>
        
        <div className={styles.conceptTableContainer}>
          <div className={styles.conceptTable}>
            {concepts.map((concept, index) => (
              <div key={concept} className={styles.conceptRow}>
                <div className={styles.conceptName}>
                  <span className={styles.conceptNumber}>{index + 1}</span>
                  {concept}
                </div>
                <div className={styles.conceptOptions}>
                  <label className={`${styles.expertiseOption} ${expertise[concept] === 'expert' ? styles.selected : ''}`}>
                    <input 
                      type="radio" 
                      name={`expertise-${concept}`} 
                      value="expert"
                      checked={expertise[concept] === 'expert'}
                      onChange={() => handleExpertiseChange(concept, 'expert')}
                    />
                    <span>Know very well</span>
                  </label>
                  <label className={`${styles.expertiseOption} ${expertise[concept] === 'familiar' ? styles.selected : ''}`}>
                    <input 
                      type="radio" 
                      name={`expertise-${concept}`} 
                      value="familiar"
                      checked={expertise[concept] === 'familiar'}
                      onChange={() => handleExpertiseChange(concept, 'familiar')}
                    />
                    <span>Somewhat familiar</span>
                  </label>
                  <label className={`${styles.expertiseOption} ${expertise[concept] === 'beginner' ? styles.selected : ''}`}>
                    <input 
                      type="radio" 
                      name={`expertise-${concept}`} 
                      value="beginner"
                      checked={expertise[concept] === 'beginner'}
                      onChange={() => handleExpertiseChange(concept, 'beginner')}
                    />
                    <span>Never studied</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.welcomeStep}>
            <h1>Hi {username || 'there'}, I'm Plato - Your personal AI-powered coding tutor.</h1>
            <p>I can generate a personalised course for you based on your needs.       
              So… Let’s get started?
            </p>
            <button className={styles.actionButton} onClick={handleReadyClick}>
              I'm ready 💪
            </button>
          </div>
        );
        
      case 2:
        return (
          <div className={styles.goalStep}>
            <h2>What is your goal?</h2>
            <p className={styles.instructionText}>
            If you're a beginner, start with a programming language. If you're prepping for coding interviews and know C++, go with the second option.

            </p>
            
            <div className={styles.optionsContainer}>
              <button 
                className={`${styles.optionButton} ${goal === 'language' ? styles.selected : ''}`}
                onClick={() => handleGoalSelection('language')}
              >
                I want to learn a programming language

              </button>
              
              <button 
                className={`${styles.optionButton} ${goal === 'dsa' ? styles.selected : ''}`}
                onClick={() => handleGoalSelection('dsa')}
              >
                I want to do interview preparation (learn DSA using C++)

              </button>
            </div>
            
            {!goal && <p className={styles.selectionHint}>Please select an option to continue</p>}
          </div>
        );

      case 3:
        return (
          <div className={styles.languageStep}>
            <h2>What language do you want to start your journey with?</h2>
            <p className={styles.instructionText}>
            If you plan to learn DSA later, choose C++, Java or Python. For building stuff, opt for Python or JavaScript.

            </p>
            
            <div className={styles.radioContainer}>
              {['Python', 'C++', 'JavaScript', 'Java'].map(lang => (
                <label key={lang} className={`${styles.radioOption} ${language === lang ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    name="language" 
                    value={lang} 
                    checked={language === lang}
                    onChange={() => handleLanguageSelection(lang)}
                  />
                  <span>{lang}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 4:
        return renderExpertiseStep();

      default:
        return null;
    }
  };

  // Update renderNavigationButtons to clearly show disabled state
  const renderNavigationButtons = () => {
    // Don't show navigation buttons in step 1
    if (currentStep === 1) {
      return null;
    }
    
    const canProceed = canProceedToNext();
    
    return (
      <div className={styles.navigationControls}>
        {currentStep > 1 && (
          <button 
            className={`${styles.navButton} ${styles.navButtonSecondary}`}
            onClick={handlePrevStep}
          >
            Previous
          </button>
        )}
        
        {currentStep < totalSteps ? (
          <button 
            className={`${styles.navButton} ${!canProceed ? styles.disabled : ''}`}
            onClick={handleNextStep}
            disabled={!canProceed}
          >
            {!canProceed ? 'Make a selection' : 'Next'}
          </button>
        ) : (
          <button 
            className={`${styles.navButton} ${!canProceed ? styles.disabled : ''}`}
            onClick={handleGenerateCourse}
            disabled={!canProceed}
          >
            {!canProceed ? 'Rate all concepts' : 'Generate Course'}
          </button>
        )}
      </div>
    );
  };

  // Render loading screen
  const renderLoadingScreen = () => {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.codeAnimation}>
            <div className={styles.codeBlock}>
              <span className={styles.codeLine}><span className={styles.codeKeyword}>function</span> buildCourse() {'{'}</span>
              <span className={styles.codeLine}>&nbsp;&nbsp;<span className={styles.codeKeyword}>const</span> <span className={styles.codeVariable}>expertise</span> = analyzeLevel();</span>
              <span className={styles.codeLine}>&nbsp;&nbsp;<span className={styles.codeKeyword}>const</span> <span className={styles.codeVariable}>topics</span> = optimizePath();</span>
              <span className={styles.codeLine}>&nbsp;&nbsp;<span className={styles.codeKeyword}>return</span> createPersonalizedPlan();</span>
              <span className={styles.codeLine}>{'}'}</span>
            </div>
          </div>
          
          {/* Progress bar with a single percentage indicator */}
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${progress}%` }}
            ></div>
            <span className={styles.progressBarText}>{progress}% Complete</span>
          </div>
          
          <h2 className={styles.loadingTitle}>Hold on… I’m creating a course for you…
          </h2>
          <p className={styles.loadingMessage}>{loadingMessage}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {isLoading ? renderLoadingScreen() : (
        <div className={styles.formContainer}>
          <div className={styles.stepContent}>
            {renderCurrentStep()}
          </div>
          {renderNavigationButtons()}
        </div>
      )}
    </div>
  );
};

export default CourseGeneration;
