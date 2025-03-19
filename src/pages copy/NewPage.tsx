import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./NewPage.css";
import { useProgress } from "../context/AppContext";
import { getPastConversations } from "../services/chatService";

const NewPage = () => {
  // State for expanded items (only one allowed per level)
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [courseName, setCourseName] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isNewCourse, setIsNewCourse] = useState<boolean>(false);
  // Add state variables to track highlighted items
  const [highlightedModuleId, setHighlightedModuleId] = useState<string | null>(null);
  const [highlightedSubtopicId, setHighlightedSubtopicId] = useState<string | null>(null);
  const [highlightedChallengeId, setHighlightedChallengeId] = useState<string | null>(null);
  const [lastVisitedType, setLastVisitedType] = useState<string | null>(null);
  
  // Refs for scrolling
  const moduleRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const subtopicRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const challengeRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  const navigate = useNavigate();
  const { setCurrentSubtopic } = useProgress();

  // Check if this is a newly generated course
  useEffect(() => {
    const newCourseGenerated = localStorage.getItem("newCourseGenerated") === "true";
    setIsNewCourse(newCourseGenerated);
    
    // Clear the flag after checking it
    if (newCourseGenerated) {
      localStorage.removeItem("newCourseGenerated");
    }
  }, []);

  // Load course data from localStorage
  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") || "JavaScript";
    const storedTopics = localStorage.getItem("topics");
    setCourseName(storedLanguage);
    
    if (storedTopics) {
      const parsedTopics = JSON.parse(storedTopics);
      setTopics(parsedTopics);
      
      // Calculate overall progress
      const totalItems = parsedTopics.reduce((total: number, topic: any) => {
        return total + topic.subtopics.reduce((subtotal: number, subtopic: any) => {
          return subtotal + 
            (subtopic.challenges?.length || 0) + 
            (subtopic.theory?.length || 0);
        }, 0);
      }, 0);
      
      const completedItems = parsedTopics.reduce((total: number, topic: any) => {
        return total + topic.subtopics.reduce((subtotal: number, subtopic: any) => {
          return subtotal + 
            (subtopic.challenges?.filter((c: any) => c.completed)?.length || 0) +
            (subtopic.theory?.filter((t: any) => t.completed)?.length || 0);
        }, 0);
      }, 0);
      
      setOverallProgress(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);
      
      // Check if there's a breadcrumb navigation state first
      const breadcrumbModule = localStorage.getItem("expandedModule");
      const breadcrumbSubtopic = localStorage.getItem("expandedSubtopic");
      
      if (breadcrumbModule) {
        setExpandedModule(breadcrumbModule);
        if (breadcrumbSubtopic) {
          setExpandedSubtopic(breadcrumbSubtopic);
          
          // Add scrolling behavior with a longer delay for breadcrumb navigation
          setTimeout(() => {
            if (moduleRefs.current[breadcrumbModule]) {
              moduleRefs.current[breadcrumbModule]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              
              setTimeout(() => {
                if (subtopicRefs.current[breadcrumbSubtopic]) {
                  subtopicRefs.current[breadcrumbSubtopic]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                }
              }, 200);
            }
          }, 300);
          
          // Clear the breadcrumb navigation state
          localStorage.removeItem("expandedModule");
          localStorage.removeItem("expandedSubtopic");
        }
      }
      // Otherwise, fall back to the original last visited logic
      else {
        // Check if there's a last visited subtopic
        const lastVisitedSubtopic = localStorage.getItem("lastVisitedSubtopic");
        const lastVisitedType = localStorage.getItem("lastVisitedType");
        
        if (lastVisitedSubtopic) {
          // Find which module contains this subtopic
          let foundModuleId = null;
          let foundSubtopicId = null;
          let foundChallengeId = null;
          
          // Search for the subtopic or challenge in topics data
          outer: for (const topic of parsedTopics) {
            for (const subtopic of topic.subtopics) {
              // Direct match with subtopic
              if (subtopic.id?.toString() === lastVisitedSubtopic || 
                  subtopic.subtopicId === lastVisitedSubtopic) {
                foundModuleId = topic.id.toString();
                foundSubtopicId = subtopic.id.toString();
                break outer;
              }
              
              // Check if any challenge in this subtopic matches
              if (lastVisitedType === "challenge" && subtopic.challenges) {
                for (const challenge of subtopic.challenges) {
                  if (challenge.id?.toString() === lastVisitedSubtopic || 
                      challenge.subtopicId === lastVisitedSubtopic) {
                    foundModuleId = topic.id.toString();
                    foundSubtopicId = subtopic.id.toString();
                    foundChallengeId = challenge.id?.toString();
                    break outer;
                  }
                }
              }
            }
          }
          
          // Set the found module as expanded
          if (foundModuleId) {
            setExpandedModule(foundModuleId);
            if (foundSubtopicId) {
              setExpandedSubtopic(foundSubtopicId);
              
              // Add scrolling behavior with a longer delay to ensure rendering is complete
              setTimeout(() => {
                // First scroll to the module
                if (moduleRefs.current[foundModuleId]) {
                  moduleRefs.current[foundModuleId]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                  
                  // Then scroll to the subtopic with an additional delay
                  setTimeout(() => {
                    if (subtopicRefs.current[foundSubtopicId]) {
                      subtopicRefs.current[foundSubtopicId]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                      });
                      
                      // If we found a specific challenge, scroll to it
                      if (foundChallengeId && lastVisitedType === "challenge") {
                        setTimeout(() => {
                          if (challengeRefs.current[foundChallengeId]) {
                            challengeRefs.current[foundChallengeId]?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center'
                            });
                          }
                        }, 200);
                      }
                    }
                  }, 200);
                }
              }, 300);
            }
          } else {
            // Fallback to first module if not found
            if (parsedTopics.length > 0) {
              setExpandedModule(parsedTopics[0].id.toString());
            }
          }
        } else {
          // Fallback: Expand the first module by default if no last visited
          if (parsedTopics.length > 0) {
            setExpandedModule(parsedTopics[0].id.toString());
          }
        }
      }
    }
  }, []);

  const toggleModule = (moduleId: string) => {
    // If clicking the same module, collapse it
    if (expandedModule === moduleId) {
      setExpandedModule(null);
      setExpandedSubtopic(null); // Also collapse any open subtopics
    } else {
      // If clicking a different module, expand it and collapse others
      setExpandedModule(moduleId);
      setExpandedSubtopic(null); // Reset subtopic selection
      
      // Scroll to center this module after a brief delay to allow rendering
      setTimeout(() => {
        if (moduleRefs.current[moduleId]) {
          moduleRefs.current[moduleId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    }
  };

  const toggleSubtopic = (subtopicId: string, event: React.MouseEvent) => {
    // Prevent event from bubbling up to module toggle handler
    event.stopPropagation();
    
    // If clicking the same subtopic, collapse it
    if (expandedSubtopic === subtopicId) {
      setExpandedSubtopic(null);
    } else {
      // If clicking a different subtopic, expand it and collapse others
      setExpandedSubtopic(subtopicId);
      
      // Scroll to center this subtopic
      setTimeout(() => {
        if (subtopicRefs.current[subtopicId]) {
          subtopicRefs.current[subtopicId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    }
  };

  const handleItemClick = async (subtopicId: string, itemType: string = "challenge") => {
    // Set the current subtopic ID and navigate to the main page
    setCurrentSubtopic(subtopicId);
    localStorage.setItem("currentSubtopic", subtopicId);
    
    // Save the last visited content information
    localStorage.setItem("lastVisitedSubtopic", subtopicId);
    localStorage.setItem("lastVisitedType", itemType);
    
    console.log("subtopicId", subtopicId);
    // Optionally, you could also store the item type if needed
    if (itemType === "theory") {
      localStorage.setItem("viewMode", "theory");
    } else {
      localStorage.removeItem("viewMode");
    }
    
    // Flag to indicate if we should auto-send a message
    let shouldAutoSendMessage = false;
    
    // Prefetch conversation data before navigation
    try {
      console.log("Prefetching conversations for subtopic:", subtopicId);
      const response = await getPastConversations(subtopicId);
      console.log("Conversations prefetched successfully");
      
      // Check if we have any conversations
      if (response.success && !response.conversationsFound) {
        console.log("No conversations found, will auto-send initial message");
        shouldAutoSendMessage = true;
      }
    } catch (error) {
      console.error("Failed to prefetch conversations:", error);
      // Continue with navigation even if prefetch fails
    }
    
    // Store the auto-send flag in localStorage for the ChatInterface to pick up
    localStorage.setItem("shouldAutoSendMessage", shouldAutoSendMessage ? "true" : "false");
    
    // Navigate to the main page after prefetch attempt
    navigate("/main");
  };

  // Get last visited content or find first incomplete challenge for resume button
  const getResumeContent = () => {
    // If this is a newly generated course, don't show resume content
    if (isNewCourse) {
      return null;
    }
    
    // First check if there's a last visited content
    const lastVisitedSubtopic = localStorage.getItem("lastVisitedSubtopic");
    const lastVisitedType = localStorage.getItem("lastVisitedType");
    
    if (lastVisitedSubtopic) {
      // Find the subtopic name and/or challenge name if applicable
      let subtopicName = "";
      let challengeName = "";
      let foundModuleId = null;
      let foundSubtopicId = null;
      let foundChallengeId = null;
      
      // Search for the subtopic in the topics data
      for (const topic of topics) {
        for (const subtopic of topic.subtopics) {
          // Check if this is the matching subtopic
          if (subtopic.id?.toString() === lastVisitedSubtopic || 
              subtopic.subtopicId === lastVisitedSubtopic) {
            subtopicName = subtopic.name;
            foundModuleId = topic.id?.toString();
            foundSubtopicId = subtopic.id?.toString();
            
            // If type is challenge, try to find the specific challenge
            if (lastVisitedType === "challenge" && subtopic.challenges) {
              // First try to find a challenge that directly matches the lastVisitedSubtopic
              const matchingChallenge = subtopic.challenges.find(
                (c: any) => c.subtopicId === lastVisitedSubtopic || c.id?.toString() === lastVisitedSubtopic
              );
              
              if (matchingChallenge) {
                challengeName = matchingChallenge.name;
                foundChallengeId = matchingChallenge.id?.toString();
              } 
              // If no direct match, fall back to first incomplete challenge
              else {
                const challenge = subtopic.challenges.find((c: any) => !c.completed);
                if (challenge) {
                  challengeName = challenge.name;
                  foundChallengeId = challenge.id?.toString();
                }
                // If all challenges are completed, just take the first one
                else if (subtopic.challenges.length > 0) {
                  challengeName = subtopic.challenges[0].name;
                  foundChallengeId = subtopic.challenges[0].id?.toString();
                }
              }
            }
            break;
          }
          
          // Also check if any challenge within the subtopic has this subtopicId
          if (subtopic.challenges && lastVisitedType === "challenge") {
            const matchingChallenge = subtopic.challenges.find(
              (c: any) => c.subtopicId === lastVisitedSubtopic || c.id?.toString() === lastVisitedSubtopic
            );
            
            if (matchingChallenge) {
              subtopicName = subtopic.name;
              challengeName = matchingChallenge.name;
              foundModuleId = topic.id?.toString();
              foundSubtopicId = subtopic.id?.toString();
              foundChallengeId = matchingChallenge.id?.toString();
              break;
            }
          }
        }
        if (subtopicName || challengeName) break;
      }
      
      return {
        navigateToId: lastVisitedSubtopic, // Changed property name to avoid duplication
        type: lastVisitedType || "challenge",
        subtopicName,
        challengeName,
        moduleId: foundModuleId,
        subtopicId: foundSubtopicId,
        challengeId: foundChallengeId,
      };
    }
    
    // Fall back to finding the first incomplete challenge
    for (const topic of topics) {
      for (const subtopic of topic.subtopics) {
        const challenge = subtopic.challenges?.find((c: any) => !c.completed);
        if (challenge) {
          return {
            navigateToId: challenge.subtopicId, // Changed property name to avoid duplication
            type: "challenge",
            subtopicName: subtopic.name,
            challengeName: challenge.name,
            moduleId: topic.id?.toString(),
            subtopicId: subtopic.id?.toString(),
            challengeId: challenge.id?.toString(),
          };
        }
      }
    }
    
    // If all challenges are completed, return the first one
    if (topics.length > 0 && topics[0].subtopics.length > 0) {
      const firstSubtopic = topics[0].subtopics[0];
      const firstChallenge = firstSubtopic.challenges?.[0];
      
      return {
        navigateToId: firstSubtopic.id.toString(), // Changed property name to avoid duplication
        type: "challenge",
        subtopicName: firstSubtopic.name,
        challengeName: firstChallenge?.name || "",
        moduleId: topics[0].id?.toString(),
        subtopicId: firstSubtopic.id?.toString(),
        challengeId: firstChallenge?.id?.toString(),
      };
    }
    
    return null;
  };

  // Calculate this once per render, not in a separate state variable/effect
  const resumeContent = getResumeContent();
  
  // Set highlighted items once when topics change or on component mount
  useEffect(() => {
    const content = getResumeContent();
    if (content) {
      setHighlightedModuleId(content.moduleId);
      setHighlightedSubtopicId(content.subtopicId);
      setHighlightedChallengeId(content.challengeId);
      setLastVisitedType(content.type);
    }
  }, [topics, isNewCourse]); // Only depends on topics and isNewCourse, not resumeContent

  // Calculate module completion percentages
  const getModuleProgress = (topic: any) => {
    const totalItems = topic.subtopics.reduce((total: number, subtopic: any) => {
      return total + 
        (subtopic.challenges?.length || 0) + 
        (subtopic.theory?.length || 0);
    }, 0);
    
    const completedItems = topic.subtopics.reduce((total: number, subtopic: any) => {
      return total + 
        (subtopic.challenges?.filter((c: any) => c.completed)?.length || 0) +
        (subtopic.theory?.filter((t: any) => t.completed)?.length || 0);
    }, 0);
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Calculate subtopic completion percentages
  const getSubtopicProgress = (subtopic: any) => {
    const totalItems = (subtopic.challenges?.length || 0) + (subtopic.theory?.length || 0);
    const completedItems = 
      (subtopic.challenges?.filter((c: any) => c.completed)?.length || 0) +
      (subtopic.theory?.filter((t: any) => t.completed)?.length || 0);
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  return (
    <div className="course-container">
      <h1 className="course-title">{courseName} Course</h1>
      
      <div className="course-content-wrapper">
        {/* Left sidebar with course info and resume button */}
        <div className="course-sidebar">
          <div className="course-info-card">
            <h2>Your Progress</h2>
            <div className="course-progress-container">
              <div className="progress-text">You've completed <span className="progress-percentage">{overallProgress}%</span></div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
              </div>
            </div>
            
            {resumeContent ? (
              <div className="resume-section">
                <h3>Continue Learning</h3>
                <p>
                  {resumeContent.type === "theory" 
                    ? `Continue learning ${resumeContent.subtopicName} theory`
                    : resumeContent.challengeName 
                      ? `Continue solving the challenge: ${resumeContent.challengeName}`
                      : `Continue learning ${resumeContent.subtopicName}`
                  }
                </p>
                <button 
                  className="resume-button" 
                  onClick={() => handleItemClick(resumeContent.navigateToId, resumeContent.type)}
                >
                  Resume Learning
                </button>
              </div>
            ) : isNewCourse ? (
              <div className="resume-section">
                <h3>Start Learning</h3>
                <p>Begin your learning journey by exploring modules in the course outline</p>
                <button 
                  className="resume-button disabled"
                  disabled
                >
                  Select a module to begin
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right side scrollable module content */}
        <div className="modules-container">
          <h2 className="modules-title">Course Modules</h2>
          <div className="modules-scrollable">
            <div className="unified-module-container">
              {topics.map((topic, index) => {
                const moduleProgress = getModuleProgress(topic);
                const isExpanded = expandedModule === topic.id.toString();
                const isHighlightedModule = highlightedModuleId === topic.id.toString();
                
                return (
                  <div 
                    key={topic.id} 
                    className={`course-module ${isHighlightedModule ? 'highlighted-module' : ''}`}
                    ref={el => moduleRefs.current[topic.id.toString()] = el}
                  >
                    <div
                      className={`module-header ${isExpanded ? 'expanded' : ''} ${isHighlightedModule ? 'highlighted-header' : ''}`}
                      onClick={() => toggleModule(topic.id.toString())}
                    >
                      <div className="module-left">
                        <div className="module-number">Module {index + 1}</div>
                        <h2 className="module-title">{topic.name}</h2>
                      </div>
                      <div className="module-right">
                        <div className="module-progress">
                          <span>{moduleProgress}%</span>
                          <div className="module-progress-bar">
                            <div className="module-progress-fill" style={{ width: `${moduleProgress}%` }}></div>
                          </div>
                        </div>
                        <div className="module-expand-icon">
                          {isExpanded ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="module-content">
                        {topic.subtopics.map((subtopic: any) => {
                          const subtopicProgress = getSubtopicProgress(subtopic);
                          const isSubtopicExpanded = expandedSubtopic === subtopic.id.toString();
                          const isHighlightedSubtopic = highlightedSubtopicId === subtopic.id.toString();
                          
                          return (
                            <div 
                              key={subtopic.id} 
                              className={`subtopic-container ${isHighlightedSubtopic ? 'highlighted-subtopic' : ''}`}
                              ref={el => subtopicRefs.current[subtopic.id.toString()] = el}
                            >
                              <div 
                                className={`subtopic-header ${isSubtopicExpanded ? 'expanded' : ''} ${isHighlightedSubtopic ? 'highlighted-header' : ''}`}
                                onClick={(e) => toggleSubtopic(subtopic.id.toString(), e)}
                              >
                                <div className="subtopic-left">
                                  <span className="subtopic-icon">📚</span>
                                  <h3 className="subtopic-title">{subtopic.name}</h3>
                                </div>
                                <div className="subtopic-right">
                                  <div className="subtopic-meta">
                                    {/* Removed estimated time span */}
                                  </div>
                                  <div className="subtopic-progress">
                                    <span>{subtopicProgress}%</span>
                                    <div className="subtopic-progress-bar">
                                      <div className="subtopic-progress-fill" style={{ width: `${subtopicProgress}%` }}></div>
                                    </div>
                                  </div>
                                  <div className="subtopic-expand-icon">
                                    {isSubtopicExpanded ? '▲' : '▼'}
                                  </div>
                                </div>
                              </div>
                              
                              {isSubtopicExpanded && (
                                <div className="learning-material-list">
                                  {/* Theory section - Single item per subtopic */}
                                  <div
                                    className={`theory-item ${isHighlightedSubtopic && lastVisitedType === 'theory' ? 'highlighted-item' : ''}`}
                                    onClick={() => handleItemClick(subtopic.subtopicId, "theory")}
                                  >
                                    <div className="theory-left">
                                      <div className="theory-status-icon">
                                        📖
                                      </div>
                                      <div className="theory-name">Learn {subtopic.name} Theory</div>
                                    </div>
                                    <div className="theory-right">
                                      {/* Removed theory time span */}
                                    </div>
                                  </div>
                                  
                                  {/* Challenge items */}
                                  {subtopic.challenges && subtopic.challenges.map((challenge: any) => (
                                    <div
                                      key={challenge.id}
                                      className={`challenge-item ${challenge.completed ? 'completed' : ''} ${highlightedChallengeId === challenge.id?.toString() ? 'highlighted-item' : ''}`}
                                      onClick={() => handleItemClick(challenge.subtopicId)}
                                      ref={el => challengeRefs.current[challenge.id?.toString()] = el}
                                    >
                                      <div className="challenge-left">
                                        <div className="challenge-status-icon">
                                          {challenge.completed ? '✓' : '○'}
                                        </div>
                                        <div className="challenge-type-icon">
                                          {challenge.type === 'quiz' ? '❓' : 
                                          challenge.type === 'coding' ? '💻' : '📝'}
                                        </div>
                                        <div className="challenge-name">{challenge.name}</div>
                                      </div>
                                      <div className="challenge-right">
                                        {/* Removed challenge time span */}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPage;
