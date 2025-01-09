import React, { useState, useEffect, useRef, useContext } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import styles from "./syllabus.module.css";
import { useProgress } from "../../context/AppContext";
import { useAuth } from '../../context/AuthContext';

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
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState<number | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [currentSubtopic, setCurrentSubtopic] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [currentindex, setcurrentindex] = useState<number | null>(null);


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



  useEffect(() => {

    if (topics) {
      findCurrentSubtopic(topics);
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
        setCurrentSubtopicIndex(topic.subtopics.indexOf(subtopic));
        localStorage.setItem('currentSubtopic', subtopic.name);
      }
    }
  };

  useEffect(() => {
    if (hasRunCode && hasClickedNextButton && currentTopic && currentSubtopicIndex !== null) {
      const newTopics = topics.map((topic) => {
        if (topic.id === currentTopic.id) {
          const updatedSubtopics = topic.subtopics.map((sub, index) => {
            if (index === currentSubtopicIndex) {
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
      setHasClickedNextButton(false);
      switchToNextSubtopic(newTopics);
    } else if (hasClickedNextButton && !hasRunCode) {
      alert('Please complete this subtopic before proceeding.');
      setHasClickedNextButton(false);
    }
  }, [hasRunCode, hasClickedNextButton, currentTopic, currentSubtopicIndex, topics]);

  const switchToNextSubtopic = (topics: Topic[]) => {
    if (currentTopic && currentSubtopicIndex !== null) {
      const nextSubtopicIndex = currentSubtopicIndex + 1;

      if (nextSubtopicIndex < currentTopic.subtopics.length) {
        const nextSubtopic = currentTopic.subtopics[nextSubtopicIndex];
        setCurrentSubtopic(nextSubtopic.name);
        setCurrentSubtopicIndex(nextSubtopicIndex);
        localStorage.setItem('currentSubtopic', nextSubtopic.name);
      } else {
        const nextTopicIndex = topics.findIndex((t) => t.id === currentTopic.id) + 1;
        if (nextTopicIndex < topics.length) {
          const nextTopic = topics[nextTopicIndex];
          const firstSubtopic = nextTopic.subtopics.find((st) => !st.completed);
          if (firstSubtopic) {
            setCurrentSubtopic(firstSubtopic.name);
            setCurrentTopic(nextTopic);
            setCurrentSubtopicIndex(0);
            setCurrentTopicIndex(nextTopicIndex);
            setcurrentindex(nextTopicIndex);// Update currentTopicIndex here
            localStorage.setItem('currentSubtopic', firstSubtopic.name);
          }
        }
      }
    }
  };

  const toggleTopic = (id: number) => {
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

  const handleSubtopicClick = (subtopic: Subtopic) => {
    if (subtopic.completed) {
      setCurrentSubtopic(subtopic.name);
      localStorage.setItem('currentSubtopic', subtopic.name);
    }
    else {
      const clickedTopic = topics.find((t) => t.subtopics.includes(subtopic));
      if (clickedTopic) {
        const clickedSubtopicIndex = clickedTopic.subtopics.indexOf(subtopic);
        if (clickedSubtopicIndex > 0) {
          const previousSubtopic = clickedTopic.subtopics[clickedSubtopicIndex - 1];
          if (previousSubtopic.completed) {
            setCurrentSubtopic(subtopic.name);
            localStorage.setItem('currentSubtopic', subtopic.name);
          }
        } else {
          // Handle the case when the clicked subtopic is the first one
          const clickedTopicindex = topics.indexOf(clickedTopic);;
          const prevtopicindex = clickedTopicindex - 1;
          if (prevtopicindex >= 0) {
            const prevTopic = topics[prevtopicindex];
            const prevSubtopic = prevTopic.subtopics[prevTopic.subtopics.length - 1];
            if (prevSubtopic.completed) {
              setCurrentSubtopic(subtopic.name);
              localStorage.setItem('currentSubtopic', subtopic.name);
            }
          }
        }
      }
    }


  };
  console.log("currentindex = ", currentindex);
  return (
    <div className={styles["syllabus-container"]}>
      <div className={styles["navigation-container"]}>
        <button onClick={() => setcurrentindex(idx => Math.max(0, idx - 1))} disabled={currentindex === 0} className={styles.arrow}>
          &#8592;
        </button>
        <div className={styles["topics-row"]}>
          {visibleTopics.map((topic, index) => (
            <div
              key={topic.id}
              className={styles.topic}
              ref={(ref) => topicRefs.current.set(topic.id, ref)}
              style={{
                fontWeight: topics.indexOf(topic) === currentTopicIndex ? 'bold' : 'normal',
                color: topics.indexOf(topic) < currentTopicIndex ? 'green' : topics.indexOf(topic) > currentTopicIndex ? 'grey' : 'black',
              }}
            >
              <div className={styles["topic-header"]} onClick={() => toggleTopic(topic.id)}>
                <span>{topic.name}</span>
                <div className={styles.icon}>{expandedTopicId === topic.id ? <ChevronDownIcon /> : <ChevronRightIcon />}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setcurrentindex(idx => Math.min(topics.length - 1, idx + 1))} disabled={currentindex === topics.length - 1} className={styles.arrow}>
          &#8594;
        </button>
      </div>

      {expandedTopicId !== null && dropdownPosition && createPortal(
        <div ref={popupRef} className={`${styles["dropdown-popup"]} ${expandedTopicId !== null ? 'show' : ''}`} style={{ top: dropdownPosition.top, left: dropdownPosition.left, position: "absolute" }}>
          <div className={styles.subtopics}>
            {topics.find((topic) => topic.id === expandedTopicId)?.subtopics.map((subtopic, index) => (
              <div key={subtopic.id} className={styles.subtopic} onClick={() => handleSubtopicClick(subtopic)}>
                <input type="checkbox" checked={subtopic.completed} style={{ backgroundColor: subtopic.completed ? 'green' : 'transparent' }} />
                <span style={{
                  color: subtopic.completed ? 'green' :
                    (index > 0 && topics.find((topic) => topic.id === expandedTopicId)?.subtopics[index - 1].completed) ||
                      (index === 0 && topics.findIndex((topic) => topic.id === expandedTopicId) > 0 && topics[topics.findIndex((topic) => topic.id === expandedTopicId) - 1].subtopics[topics[topics.findIndex((topic) => topic.id === expandedTopicId) - 1].subtopics.length - 1].completed) ||
                      (index === 0 && topics.findIndex((topic) => topic.id === expandedTopicId) === 0)
                      ? 'black' : 'grey'
                }}>{subtopic.name}</span>
              </div>
            ))}
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Syllabus;