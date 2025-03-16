import { useState, useEffect, useRef, useCallback } from 'react';
import { useProgress } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import posthog from 'posthog-js';
import { getPastConversations } from './chatService';

interface Challenge {
  id: string;
  name: string;
  subtopicId: string;
  completed: boolean;
}

interface Subtopic {
  id: string;
  name: string;
  completed: boolean;
  subtopicId?: string;
  challenges?: Challenge[];
  theory?: any[];
}

interface Topic {
  id: number;
  name: string;
  subtopics: Subtopic[];
  completed: boolean;
}

interface LanguageTopic {
  language: string;
  topics: Topic[];
}

export const useSyllabusProgress = () => {
  const { 
    currentSubtopic, 
    setCurrentSubtopic, 
    hasRunCode, 
    setHasRunCode,
    hasClickedNextButton,
    setHasClickedNextButton,
    setPracticeMode 
  } = useProgress();
  const { setShouldClearCode } = useAuth();
  const [allTopics, setAllTopics] = useState<LanguageTopic[]>([]);
  
  // Ref to store allTopics for use in event listeners and intervals
  const allTopicsRef = useRef<LanguageTopic[]>([]);
  
  // Add ref to track the last time we sent data to the backend
  const lastSyncTimeRef = useRef<number>(Date.now());
  
  // Add ref to track if navigation is in progress to prevent duplicate requests
  const navigationInProgressRef = useRef<boolean>(false);
  
  // Load topics from localStorage
  useEffect(() => {
    const storedTopics = localStorage.getItem('allTopics');
    if (storedTopics) {
      const parsedTopics = JSON.parse(storedTopics);
      setAllTopics(parsedTopics);
      allTopicsRef.current = parsedTopics;
    }
  }, []);
  
  // Update ref when allTopics changes
  useEffect(() => {
    allTopicsRef.current = allTopics;
  }, [allTopics]);

  // Function to send topics to backend with throttling check
  const sendTopicsToBackend = useCallback((topics: LanguageTopic[], force: boolean = false) => {
    // Only send if forced or it's been at least 60 seconds since last sync
    const now = Date.now();
    if (!force && now - lastSyncTimeRef.current < 60000) {
      console.log("Skipping backend sync - last sync was", (now - lastSyncTimeRef.current) / 1000, "seconds ago");
      return;
    }
    
    const url = `${process.env.REACT_APP_API_URL}/language/update-topics`;
    const token = localStorage.getItem("token");
    
    try {
      // Update the last sync time
      lastSyncTimeRef.current = now;
      console.log("Syncing topics with backend at", new Date().toISOString());
      
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
  }, []);

  // Set up auto-save interval - changed to 1 minute
  useEffect(() => {
    // Clear any existing interval first
    if ((window as any)._autoSaveInterval) {
      clearInterval((window as any)._autoSaveInterval);
      (window as any)._autoSaveInterval = null;
    }
    
    // Set up new interval with 1 minute delay
    console.log("Setting up auto-save interval for progress sync (every 1 minute)");
    (window as any)._autoSaveInterval = setInterval(() => {
      const topics = allTopicsRef.current;
      if (topics && topics.length > 0) {
        sendTopicsToBackend(topics);
      }
    }, 60000); // Every 1 minute

    // Enhanced unload handler for saving progress
    const handleBeforeUnload = () => {
      const topics = allTopicsRef.current;
      if (topics && topics.length > 0) {
        sendTopicsToBackend(topics, true); // Force send on unload
        localStorage.setItem('allTopics', JSON.stringify(topics));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval((window as any)._autoSaveInterval);
      (window as any)._autoSaveInterval = null;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendTopicsToBackend]);

  // Handle marking challenges as completed
  useEffect(() => {
    if (hasRunCode && currentSubtopic) {
      // Don't mark DSA practice mode challenges as completed
      if (currentSubtopic.includes('DSA_problemset_')) {
        return;
      }
      
      console.log("Marking challenge as completed:", currentSubtopic);
      
      // Find the challenge in allTopics and mark it as completed
      const updatedTopics = allTopics.map(languageTopic => {
        const language = localStorage.getItem('language');
        
        // Only update the currently active language
        if (languageTopic.language !== language) {
          return languageTopic;
        }
        
        const topics = languageTopic.topics.map(topic => {
          // Deep clone to avoid direct state mutation
          const updatedTopic = { ...topic };
          let topicUpdated = false;
          
          updatedTopic.subtopics = topic.subtopics.map(subtopic => {
            // Deep clone the subtopic
            const updatedSubtopic = { ...subtopic };
            let subtopicUpdated = false;
            
            // Match by subtopicId for direct subtopic content
            if (subtopic.subtopicId === currentSubtopic) {
              updatedSubtopic.completed = true;
              subtopicUpdated = true;
            }
            
            // For challenges inside a subtopic
            if (subtopic.challenges) {
              updatedSubtopic.challenges = subtopic.challenges.map(challenge => {
                if (challenge.subtopicId === currentSubtopic) {
                  subtopicUpdated = true;
                  return { ...challenge, completed: true };
                }
                return challenge;
              });
              
              // Check if all challenges are completed to mark subtopic as completed
              const allChallengesCompleted = updatedSubtopic.challenges.every(c => c.completed);
              if (allChallengesCompleted) {
                updatedSubtopic.completed = true;
                subtopicUpdated = true;
              }
            }
            
            if (subtopicUpdated) {
              topicUpdated = true;
            }
            
            return updatedSubtopic;
          });
          
          // Check if all subtopics are completed to mark topic as completed
          const allSubtopicsCompleted = updatedTopic.subtopics.every(s => s.completed);
          if (allSubtopicsCompleted && topicUpdated) {
            updatedTopic.completed = true;
          }
          
          return updatedTopic;
        });
        
        return { ...languageTopic, topics };
      });
      
      // Update state and localStorage
      setAllTopics(updatedTopics);
      localStorage.setItem('allTopics', JSON.stringify(updatedTopics));
      
      // Also update topics for the current language
      const currentLanguage = localStorage.getItem('language');
      const languageTopics = updatedTopics.find(lt => lt.language === currentLanguage);
      if (languageTopics) {
        localStorage.setItem('topics', JSON.stringify(languageTopics.topics));
      }
      
      // Sync with backend - force sync to ensure completion is recorded
      sendTopicsToBackend(updatedTopics, true);
      
      // Reset hasRunCode to prevent duplicate updates
      setHasRunCode(false);
    }
  }, [hasRunCode, currentSubtopic, allTopics, sendTopicsToBackend, setHasRunCode]);

  // Handle next button click with improved error handling and conversation check
  useEffect(() => {
    if (hasClickedNextButton && currentSubtopic && !navigationInProgressRef.current) {
      console.log("Next button clicked, handling navigation");
      navigationInProgressRef.current = true;
      
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      
      // Find the current topic and subtopic
      let currentTopic = null;
      let currentSubtopicObj = null;
      let currentTopicIndex = -1;
      let currentSubtopicIndex = -1;
      let currentChallengeIndex = -1;
      
      // First find if this is a direct subtopic or a challenge within a subtopic
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        for (let j = 0; j < topic.subtopics.length; j++) {
          const subtopic = topic.subtopics[j];
          
          // Check if this is a direct subtopic match
          if (subtopic.subtopicId === currentSubtopic) {
            currentTopic = topic;
            currentSubtopicObj = subtopic;
            currentTopicIndex = i;
            currentSubtopicIndex = j;
            break;
          }
          
          // Check if this is a challenge within this subtopic
          if (subtopic.challenges) {
            for (let k = 0; k < subtopic.challenges.length; k++) {
              const challenge = subtopic.challenges[k];
              if (challenge.subtopicId === currentSubtopic) {
                currentTopic = topic;
                currentSubtopicObj = subtopic;
                currentTopicIndex = i;
                currentSubtopicIndex = j;
                currentChallengeIndex = k;
                break;
              }
            }
          }
          
          if (currentTopic) break;
        }
        if (currentTopic) break;
      }
      
      // Found the current context, now determine next content
      if (currentTopic && currentSubtopicObj) {
        // Case 1: We're in a challenge, check for next challenge in same subtopic
        if (currentChallengeIndex >= 0) {
          const challenges = currentSubtopicObj.challenges || [];
          if (currentChallengeIndex < challenges.length - 1) {
            // Move to next challenge in same subtopic
            const nextChallenge = challenges[currentChallengeIndex + 1];
            navigateToNextContent(nextChallenge.subtopicId);
            return;
          }
          // No more challenges in this subtopic, move to next subtopic
        }
        
        // Case 2: Move to next subtopic in same topic
        if (currentSubtopicIndex < currentTopic.subtopics.length - 1) {
          const nextSubtopic = currentTopic.subtopics[currentSubtopicIndex + 1];
          navigateToFirstContentInSubtopic(nextSubtopic);
          return;
        }
        
        // Case 3: Move to first subtopic in next topic
        if (currentTopicIndex < topics.length - 1) {
          const nextTopic = topics[currentTopicIndex + 1];
          if (nextTopic.subtopics.length > 0) {
            navigateToFirstContentInSubtopic(nextTopic.subtopics[0]);
            return;
          }
        }
        
        // Case 4: We're at the end of the course
        console.log("Reached the end of the course!");
        // Reset navigation flag since we're not going anywhere
        navigationInProgressRef.current = false;
        // Maybe show a congratulations message or navigate to a completion page
      } else {
        console.error("Could not find current topic/subtopic context for navigation");
        navigationInProgressRef.current = false;
      }
      
      // Reset the click state regardless of navigation
      setHasClickedNextButton(false);
    }
  }, [hasClickedNextButton, currentSubtopic, setHasClickedNextButton]);

  // Helper method to check if conversations exist and auto-send if needed
  const checkForConversationsAndInitialize = useCallback(async (subtopicId: string) => {
    try {
      // Check if there are existing conversations for this subtopic
      const response = await getPastConversations(subtopicId);
      
      // Determine if this is theory or challenge based on ID format or current mode
      const isTheory = subtopicId?.includes('theory') || 
                      (localStorage.getItem('viewMode') === 'theory');
                      
      // Set the appropriate view mode 
      localStorage.setItem('viewMode', isTheory ? 'theory' : 'challenge');
      
      // CRITICAL FIX: Only set auto-send flag if NO conversations exist
      // Check both success and data array length to determine if conversations exist
      const hasConversations = 
        response.success && 
        ((Array.isArray(response.data) && response.data.length > 0));
      
      console.log("Has existing conversations:", hasConversations);
      
      // Only trigger auto-send if no conversations exist
      localStorage.setItem("shouldAutoSendMessage", hasConversations ? "false" : "true");
      
      return !hasConversations;
    } catch (error) {
      console.error("Error checking for conversations:", error);
      // Default to false to avoid triggering auto-send on error
      localStorage.setItem("shouldAutoSendMessage", "false");
      return false;
    }
  }, []);

  // Function to navigate to the next content with improved initialization
  const navigateToNextContent = useCallback(async (nextSubtopicId: string, contentType: string = "challenge") => {
    console.log("Navigating to next content:", nextSubtopicId, "type:", contentType);
    
    try {
      // First clear messages and set the next subtopic
      setCurrentSubtopic(nextSubtopicId);
      setShouldClearCode(true);
      
      // Save the last visited content information (like in NewPage)
      localStorage.setItem("lastVisitedSubtopic", nextSubtopicId);
      localStorage.setItem("lastVisitedType", contentType);
      localStorage.setItem("currentSubtopic", nextSubtopicId);
      
      // Set the view mode based on content type (like in NewPage)
      if (contentType === "theory") {
        localStorage.setItem("viewMode", "theory");
      } else {
        localStorage.removeItem("viewMode");
      }
      
      // CRITICAL: Make sure the AI response will appear
      await checkForConversationsAndInitialize(nextSubtopicId);
      
      // Log the navigation with Posthog
      posthog.capture('module_changed', {
        button: 'Next',
        from: currentSubtopic,
        to: nextSubtopicId
      });

      // We're already on the main page, so just update the content without navigation
      if (window.location.pathname === '/main') {
        // Always force a refresh to ensure new content is loaded correctly
        localStorage.setItem("shouldAutoSendMessage", "true");
        
        // Force a re-render by setting a temporary flag in location state
        window.history.replaceState(
          { ...window.history.state, refresh: true },
          '',
          window.location.href
        );
        
        // If no history API support, fall back to reload
        setTimeout(() => {
          if (!localStorage.getItem("alreadyRefreshed")) {
            window.location.reload();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error during navigation:", error);
    } finally {
      // Always reset these flags
      setHasClickedNextButton(false);
      navigationInProgressRef.current = false;
    }
  }, [currentSubtopic, setCurrentSubtopic, setShouldClearCode, setHasClickedNextButton, checkForConversationsAndInitialize]);

  // Function to navigate to previous content with improved initialization - update with same pattern
  const navigateToPrevContent = useCallback(async (prevSubtopicId: string, contentType: string = "challenge") => {
    console.log("Navigating to previous content:", prevSubtopicId, "type:", contentType);
    
    try {
      // Clear messages and set the previous subtopic
      setCurrentSubtopic(prevSubtopicId);
      setShouldClearCode(true);
      
      // Save the last visited content information (like in NewPage)
      localStorage.setItem("lastVisitedSubtopic", prevSubtopicId);
      localStorage.setItem("lastVisitedType", contentType);
      localStorage.setItem("currentSubtopic", prevSubtopicId);
      
      // Set the view mode based on content type (like in NewPage)
      if (contentType === "theory") {
        localStorage.setItem("viewMode", "theory");
      } else {
        localStorage.removeItem("viewMode");
      }
      
      // CRITICAL: Make sure the AI response will appear
      await checkForConversationsAndInitialize(prevSubtopicId);
      
      // Log the navigation with Posthog
      posthog.capture('module_changed', {
        button: 'Previous',
        from: currentSubtopic,
        to: prevSubtopicId
      });

      // We're already on the main page, so just update the content without navigation
      if (window.location.pathname === '/main') {
        // Always force a refresh to ensure new content is loaded correctly
        localStorage.setItem("shouldAutoSendMessage", "true");
        
        // Force a re-render by setting a temporary flag in location state
        window.history.replaceState(
          { ...window.history.state, refresh: true },
          '',
          window.location.href
        );
        
        // If no history API support, fall back to reload
        setTimeout(() => {
          if (!localStorage.getItem("alreadyRefreshed")) {
            window.location.reload();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error during prev navigation:", error);
    } finally {
      navigationInProgressRef.current = false;
    }
  }, [currentSubtopic, setCurrentSubtopic, setShouldClearCode, checkForConversationsAndInitialize]);

  // Update navigateToFirstContentInSubtopic to pass contentType
  const navigateToFirstContentInSubtopic = useCallback((subtopic: Subtopic) => {
    // Check if the subtopic has a theory section first - always prioritize theory first
    // We consider the subtopic itself to represent the theory content
    const hasTheory = true; // All subtopics have an implicit theory section
    
    if (hasTheory) {
      // If there's theory, navigate to it first
      navigateToNextContent(subtopic.subtopicId, "theory");
    } else if (subtopic.challenges && subtopic.challenges.length > 0) {
      // Otherwise go to first challenge
      navigateToNextContent(subtopic.challenges[0].subtopicId, "challenge");
    } else {
      // Fallback to the subtopic itself as challenge if no specific challenges
      navigateToNextContent(subtopic.subtopicId, "challenge");
    }
  }, [navigateToNextContent]);

  // Update navigateToLastContentInSubtopic to check for theory/challenge
  const navigateToLastContentInSubtopic = useCallback((subtopic: Subtopic) => {
    // If subtopic has challenges, go to last challenge, otherwise go to theory
    if (subtopic.challenges && subtopic.challenges.length > 0) {
      navigateToPrevContent(subtopic.challenges[subtopic.challenges.length - 1].subtopicId, "challenge");
    } else {
      // If no challenges, go to theory section
      navigateToPrevContent(subtopic.subtopicId, "theory");
    }
  }, [navigateToPrevContent]);

  // Handle navigation to previous topic/subtopic/challenge with improved error handling
  const handlePrevTopic = useCallback(async () => {
    if (navigationInProgressRef.current) {
      console.log("Navigation already in progress, ignoring prev click");
      return;
    }
    
    navigationInProgressRef.current = true;
    
    try {
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      if (!topics.length) {
        console.log("No topics found, cannot navigate");
        navigationInProgressRef.current = false;
        return;
      }
      
      // Find the current position
      let currentTopic = null;
      let currentSubtopicObj = null;
      let currentTopicIndex = -1;
      let currentSubtopicIndex = -1;
      let currentChallengeIndex = -1;
      let isTheory = localStorage.getItem('viewMode') === 'theory';
      
      // First find the current context in the course structure
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        for (let j = 0; j < topic.subtopics.length; j++) {
          const subtopic = topic.subtopics[j];
          
          // Check if this is a direct subtopic match (theory content)
          if (subtopic.subtopicId === currentSubtopic) {
            currentTopic = topic;
            currentSubtopicObj = subtopic;
            currentTopicIndex = i;
            currentSubtopicIndex = j;
            isTheory = true; // Explicitly mark as theory since we matched on subtopic directly
            break;
          }
          
          // Check if this is a challenge within this subtopic
          if (subtopic.challenges) {
            for (let k = 0; k < subtopic.challenges.length; k++) {
              const challenge = subtopic.challenges[k];
              if (challenge.subtopicId === currentSubtopic) {
                currentTopic = topic;
                currentSubtopicObj = subtopic;
                currentTopicIndex = i;
                currentSubtopicIndex = j;
                currentChallengeIndex = k;
                isTheory = false; // Explicitly mark as challenge
                break;
              }
            }
          }
          
          if (currentTopic) break;
        }
        if (currentTopic) break;
      }
      
      // Now determine the previous content
      if (currentTopic && currentSubtopicObj) {
        // Case 1: If we're in a challenge, check if we have previous challenges
        if (!isTheory && currentChallengeIndex > 0) {
          const prevChallenge = currentSubtopicObj.challenges[currentChallengeIndex - 1];
          navigateToPrevContent(prevChallenge.subtopicId, "challenge");
          return;
        }
        
        // Case 2: If we're in the first challenge, go to theory of same subtopic
        if (!isTheory && currentChallengeIndex === 0) {
          navigateToPrevContent(currentSubtopicObj.subtopicId, "theory");
          return;
        }
        
        // Case 3: If we're in theory, check for previous subtopic
        if (isTheory && currentSubtopicIndex > 0) {
          const prevSubtopic = currentTopic.subtopics[currentSubtopicIndex - 1];
          navigateToLastContentInSubtopic(prevSubtopic);
          return;
        }
        
        // Case 4: If we're in the first subtopic's theory, go to previous topic
        if (isTheory && currentSubtopicIndex === 0 && currentTopicIndex > 0) {
          const prevTopic = topics[currentTopicIndex - 1];
          if (prevTopic.subtopics.length > 0) {
            navigateToLastContentInSubtopic(prevTopic.subtopics[prevTopic.subtopics.length - 1]);
            return;
          }
        }
        
        console.log("Already at the beginning of the course!");
        navigationInProgressRef.current = false;
      } else {
        console.error("Could not find current topic/subtopic context for prev navigation");
        navigationInProgressRef.current = false;
      }
    } catch (error) {
      console.error("Error handling previous topic navigation:", error);
      navigationInProgressRef.current = false;
    }
  }, [currentSubtopic, navigateToPrevContent, navigateToLastContentInSubtopic]);

  // Handle navigation to next topic/subtopic/challenge - public method for components to use
  const handleNextTopic = useCallback(() => {
    if (navigationInProgressRef.current) {
      console.log("Navigation already in progress, ignoring next click");
      return;
    }
    
    navigationInProgressRef.current = true;
    
    try {
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      if (!topics.length) {
        console.log("No topics found, cannot navigate");
        navigationInProgressRef.current = false;
        return;
      }
      
      // Find the current position
      let currentTopic = null;
      let currentSubtopicObj = null;
      let currentTopicIndex = -1;
      let currentSubtopicIndex = -1;
      let currentChallengeIndex = -1;
      let isTheory = localStorage.getItem('viewMode') === 'theory';
      
      // First find the current context in the course structure
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        for (let j = 0; j < topic.subtopics.length; j++) {
          const subtopic = topic.subtopics[j];
          
          // Check if this is a direct subtopic match (theory content)
          if (subtopic.subtopicId === currentSubtopic) {
            currentTopic = topic;
            currentSubtopicObj = subtopic;
            currentTopicIndex = i;
            currentSubtopicIndex = j;
            isTheory = true; // Explicitly mark as theory since we matched on subtopic directly
            break;
          }
          
          // Check if this is a challenge within this subtopic
          if (subtopic.challenges) {
            for (let k = 0; k < subtopic.challenges.length; k++) {
              const challenge = subtopic.challenges[k];
              if (challenge.subtopicId === currentSubtopic) {
                currentTopic = topic;
                currentSubtopicObj = subtopic;
                currentTopicIndex = i;
                currentSubtopicIndex = j;
                currentChallengeIndex = k;
                isTheory = false; // Explicitly mark as challenge
                break;
              }
            }
          }
          
          if (currentTopic) break;
        }
        if (currentTopic) break;
      }
      
      // Found the current context, now determine next content
      if (currentTopic && currentSubtopicObj) {
        // Case 1: If we're in theory, check if we have challenges
        if (isTheory && currentSubtopicObj.challenges && currentSubtopicObj.challenges.length > 0) {
          // Move from theory to first challenge in same subtopic
          const firstChallenge = currentSubtopicObj.challenges[0];
          navigateToNextContent(firstChallenge.subtopicId, "challenge");
          return;
        }
        
        // Case 2: If we're in a challenge, check for next challenge in same subtopic
        if (!isTheory && currentChallengeIndex < (currentSubtopicObj.challenges?.length - 1)) {
          // Move to next challenge in same subtopic
          const nextChallenge = currentSubtopicObj.challenges[currentChallengeIndex + 1];
          navigateToNextContent(nextChallenge.subtopicId, "challenge");
          return;
        }
        
        // Case 3: Move to next subtopic's theory
        if (currentSubtopicIndex < currentTopic.subtopics.length - 1) {
          const nextSubtopic = currentTopic.subtopics[currentSubtopicIndex + 1];
          navigateToNextContent(nextSubtopic.subtopicId, "theory");
          return;
        }
        
        // Case 4: Move to first subtopic in next topic
        if (currentTopicIndex < topics.length - 1) {
          const nextTopic = topics[currentTopicIndex + 1];
          if (nextTopic.subtopics.length > 0) {
            navigateToNextContent(nextTopic.subtopics[0].subtopicId, "theory");
            return;
          }
        }
        
        console.log("Reached the end of the course!");
        navigationInProgressRef.current = false;
      } else {
        console.error("Could not find current topic/subtopic context for navigation");
        navigationInProgressRef.current = false;
      }
    } catch (error) {
      console.error("Error handling next topic navigation:", error);
    } finally {
      navigationInProgressRef.current = false;
    }
  }, [currentSubtopic, navigateToNextContent]);

  // Helper method to clear messages in chat interface
  const setMessages = useCallback((messages: any[] = []) => {
    // This is a placeholder - the actual implementation will connect with ChatInterface
    console.log("Messages cleared for navigation");
  }, []);

  // Return the public API of the hook
  return {
    handleNextTopic,
    handlePrevTopic,
    allTopics
  };
};
