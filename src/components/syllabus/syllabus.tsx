import React, { useState, useEffect, useRef, useContext } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import styles from "./syllabus.module.css";
import { useProgress } from "../../context/AppContext";
import { useAuth } from '../../context/AuthContext';
import posthog from "posthog-js";
interface Subtopic {
  id: number;
  name: string;
  completed: boolean;
}

interface Topic {
  id: number;
  name: string;
  subtopics: Subtopic[];
  completed: boolean;
}



const Syllabus: React.FC = () => {
  const [topics, setTopics] = useState<any>(() => {
    const storedTopics = localStorage.getItem('topics');
    return storedTopics ? JSON.parse(storedTopics) : null;
  });
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const topicRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [visibleTopics, setVisibleTopics] = useState(() => {
    if (topics) {
      return topics;
    } else {
      return [];
    }
  });
  const { hasRunCode, hasClickedNextButton, setHasRunCode, setHasClickedNextButton } = useProgress();
  const {currentTopic, setCurrentTopic} = useProgress();
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [currentindex, setcurrentindex] = useState<number | null>(null);
  const {currentSubtopic , setCurrentSubtopic} = useProgress();
  const { setShouldClearCode } = useAuth();
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const arrowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentSubtopicIndex = (topic: Topic): number => {
    const storedSubtopic = currentSubtopic;
    if (!storedSubtopic) return -1;
    return topic.subtopics.findIndex((sub) => sub.name === storedSubtopic);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setExpandedTopicId(null);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [expandedTopicId]);

  useEffect(() => {
    if (!topics) {
      const storedTopics = localStorage.getItem('topics');
      if (storedTopics) {
        setTopics(JSON.parse(storedTopics));
      }
    }
  }, [topics, setTopics]);

  // useEffect(() => {
  //   findCurrentSubtopic(topics);
  // }, []);

  useEffect(() => {

    if (topics) {
      //findCurrentSubtopic(topics);
      localStorage.setItem('topics', JSON.stringify(topics));
    }
  }, [topics]);

  const findCurrentSubtopic = (topics: Topic[]) => {
    const topic = topics.find((t) => !t.completed);
    setCurrentTopicIndex(topic ? topics.indexOf(topic) : 0);
    setcurrentindex(topic ? topics.indexOf(topic) : 0);
    if (topic) {
      const subtopic = topic.subtopics.find((st) => !st.completed);
      if (subtopic) {
        setCurrentSubtopic(subtopic.name);
        setCurrentTopic(topic);
        setCurrentSubtopic(subtopic.name);
      }
    }
  };
  const hasCalledFindCurrentSubtopic = useRef(false);
  useEffect(() => {
    if (!hasCalledFindCurrentSubtopic.current && topics) {
      findCurrentSubtopic(topics);
      hasCalledFindCurrentSubtopic.current = true;
    }
  }, [topics]);

  useEffect(() => {
    if (hasClickedNextButton && currentTopic && currentSubtopic) {
      let newTopics = topics;
      const subIdx = getCurrentSubtopicIndex(currentTopic);
      if (hasRunCode) {
        newTopics = topics.map((topic) => {
          if (topic.id === currentTopic.id) {
            const updatedSubtopics = topic.subtopics.map((sub, index) => {
              if (index === subIdx) {
                return { ...sub, completed: true };
              }
              return sub;
            });
            return { ...topic, subtopics: updatedSubtopics, completed: updatedSubtopics.every(st => st.completed) };
          }
          return topic;
        });

        setTopics(newTopics);
        setHasRunCode(false);
      }
      setHasClickedNextButton(false);
      switchToNextSubtopic(newTopics);
    }

    updateAllTopicsInLocalStorage(topics);
  }, [hasRunCode, hasClickedNextButton, currentTopic, currentSubtopic, topics]);

  const switchToNextSubtopic = (topics: Topic[]) => {
    console.log("currentTopic in switchToNextSubtopic", currentTopic);
    let nextSubtopic;
    if (currentTopic) {
      const currentIdx = getCurrentSubtopicIndex(currentTopic);
      const nextSubtopicIndex = currentIdx + 1;

      if (nextSubtopicIndex < currentTopic.subtopics.length) {
        nextSubtopic = currentTopic.subtopics[nextSubtopicIndex];
        posthog.capture('module_changed' , {
          button : 'next',
          from : currentSubtopic,
          to : nextSubtopic.name
          
        });

        setCurrentSubtopic(nextSubtopic.name); // Update currentSubtopic here as wellt
      } else {
        const nextTopicIndex = topics.findIndex((t) => t.id === currentTopic.id) + 1;
        console.log("finding new topic", topics[nextTopicIndex]);
        if (nextTopicIndex < topics.length) {
          const nextTopic = topics[nextTopicIndex];
          const firstSubtopic = nextTopic.subtopics[0];
          console.log("new subtopic 1", firstSubtopic);
          if (firstSubtopic) {
            console.log("new subtopic", currentSubtopic);
            setCurrentSubtopic(firstSubtopic.name);
            posthog.capture('module_changed' , {
              button : 'next',
              from : currentSubtopic,
              to : firstSubtopic.name
              
            });
            
            setCurrentTopic(nextTopic);
            setCurrentTopicIndex(nextTopicIndex);
            setcurrentindex(nextTopicIndex);// Update currentTopicIndex here
          }
        }
      }
      
      
      setShouldClearCode(true);
    }
  };
  const updateAllTopicsInLocalStorage = (updatedTopics: Topic[]) => {
    const storedAllTopics = localStorage.getItem('allTopics');
    if (storedAllTopics) {
      const allTopics = JSON.parse(storedAllTopics);
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage) {
        const updatedAllTopics = allTopics.map((topic) => {
          if (topic.language === currentLanguage) {
            return { ...topic, topics: updatedTopics };
          }
          return topic;
        });
        localStorage.setItem('allTopics', JSON.stringify(updatedAllTopics));
      }
    }
  };
  const toggleTopic = (id: number) => {
    
      posthog.capture('course_menu_topic_clicked' , {
        topic :topics.find((t) => t.id === id)?.name  
      });
    if (expandedTopicId === id) {
      setExpandedTopicId(null);
      setDropdownPosition(null);
    } else {
      const ref = topicRefs.current.get(id);
      if (ref) {
        const rect = ref.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      }
      setExpandedTopicId(id);
    }
  };


  useEffect(() => {
    if (topics != null) {
      let startIndex, endIndex;
      if (currentindex === 0) {
        startIndex = 0;
        endIndex = Math.min(topics.length, 3);
      } else if (currentindex === topics.length - 1) {
        startIndex = Math.max(0, topics.length - 3);
        endIndex = topics.length;
      } else {
        startIndex = Math.max(0, currentindex - 1);
        endIndex = Math.min(topics.length, currentindex + 2);
      }
      const visibleTopics = topics.slice(startIndex, endIndex);
      setVisibleTopics(visibleTopics);
    }
  }, [topics, currentindex]);
    // New arrow click handlers
    const handleLeftArrowClick = () => {
      // If no previous index recorded, store current value.
      if (prevIndex === null && currentindex !== null) {
        setPrevIndex(currentindex);
      }
      setcurrentindex((idx) => idx !== null ? Math.max(0, idx - 1) : 0);
      if (arrowTimeoutRef.current) {
        clearTimeout(arrowTimeoutRef.current);
      }
      arrowTimeoutRef.current = setTimeout(() => {
        if (prevIndex !== null) {
          setcurrentindex(prevIndex);
          setPrevIndex(null);
        }
      }, 7000); // Reset after 3 seconds of inactivity
      const currentLanguage = localStorage.getItem('language');
      posthog.capture('course_menu_clicked' , {
        Language : currentLanguage  
      });
    };
  
    const handleRightArrowClick = () => {
      if (prevIndex === null && currentindex !== null) {
        setPrevIndex(currentindex);
      }
      setcurrentindex((idx) => idx !== null ? Math.min(topics.length - 1, idx + 1) : 0);
      if (arrowTimeoutRef.current) {
        clearTimeout(arrowTimeoutRef.current);
      }
      arrowTimeoutRef.current = setTimeout(() => {
        if (prevIndex !== null) {
          setcurrentindex(prevIndex);
          setPrevIndex(null);
        }
      }, 7000); // Reset after 3 seconds
      const currentLanguage = localStorage.getItem('language');
      posthog.capture('course_menu_clicked' , {
        Language : currentLanguage  
      });
    };
  const handleSubtopicClick = (subtopic: Subtopic, topic: Topic) => {
    if (arrowTimeoutRef.current) {
      clearTimeout(arrowTimeoutRef.current);
      setPrevIndex(null);
    }
    setCurrentTopic(topic);
    console.log("current topic in subtopic", topic);
    console.log("current subtopic in subtopic", subtopic);
    setCurrentTopicIndex(topics.indexOf(topic));
    
    setcurrentindex(topics.indexOf(topic));
    if (subtopic.completed) {
      setCurrentSubtopic(subtopic.name);
      localStorage.setItem('currentSubtopic', subtopic.name);
    }
    else {
      const clickedTopic = topics.find((t) => t.subtopics.includes(subtopic));
      if (clickedTopic) {
        const clickedSubtopicIndex = clickedTopic.subtopics.indexOf(subtopic);
        if (clickedSubtopicIndex > 0) {
         
            setCurrentSubtopic(subtopic.name);
            localStorage.setItem('currentSubtopic', subtopic.name);
          
        } else {
          // Handle the case when the clicked subtopic is the first one
          const clickedTopicindex = topics.indexOf(clickedTopic);;
          
          
            
              setCurrentSubtopic(subtopic.name);
              localStorage.setItem('currentSubtopic', subtopic.name);
          
        }
      }
    }
  };
  console.log("currentindex = ", currentindex);
  return (
    <div className={styles["syllabus-container"]}>
      <div className={styles["navigation-container"]}>
        <button
          onClick={handleLeftArrowClick}
          disabled={currentindex === 0}
          className={`${styles.arrow} ${styles["left-arrow"]}`}
        >
          &#8592;
        </button>
        <div className={styles["topics-wrapper"]}>
          <div className={styles["topics-row"]}>
            {visibleTopics.map((topic) => {
              const isCurrent = currentTopic && currentTopic.id === topic.id;
              const topicColor = isCurrent
                ? "black"
                : topic.completed
                ? "green"
                :"black"; 
                 
                
              return (
                <div
                  key={topic.id}
                  className={styles.topic}
                  ref={(ref) => topicRefs.current.set(topic.id, ref)}
                  style={{
                    fontWeight: currentTopic && currentTopic.id === topic.id ? "bold" : "normal",
                    color: topicColor,
                  }}
                >
                  <div
                    className={styles["topic-header"]}
                    onClick={() => toggleTopic(topic.id)}
                  >
                    <span>{topic.name}</span>
                    <div className={styles.icon}>
                      {expandedTopicId === topic.id ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleRightArrowClick}
          disabled={currentindex === topics.length - 1}
          className={`${styles.arrow} ${styles["right-arrow"]}`}
        >
          &#8594;
        </button>
      </div>
      {expandedTopicId !== null && dropdownPosition && createPortal(
        <div
          ref={popupRef}
          className={`${styles["dropdown-popup"]} ${expandedTopicId !== null ? 'show' : ''}`}
          style={{ top: dropdownPosition.top, left: dropdownPosition.left, position: "absolute" }}
        >
          <div className={styles.subtopics}>
            {(() => {
              const currentTopicData = topics.find((topic: Topic) => topic.id === expandedTopicId);
              const topicHasCompleted = currentTopicData ? currentTopicData.subtopics.some(st => st.completed) : false;
              return currentTopicData?.subtopics.map((subtopic: Subtopic) => (
                <div
                  key={subtopic.id}
                  className={styles.subtopic}
                  onClick={() => handleSubtopicClick(subtopic, currentTopicData)}
                >
                  <input
                    type="checkbox"
                    checked={subtopic.completed}
                    style={{ backgroundColor: subtopic.completed ? 'green' : 'transparent' }}
                  />
                  <span style={{
                    color: subtopic.completed ? 'green' :'black'
                  }}>
                    {subtopic.name}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Syllabus;