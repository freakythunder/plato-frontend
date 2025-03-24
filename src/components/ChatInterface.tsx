// src/components/ChatInterface.tsx
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '../Styles/ChatInterface.module.css';
import { sendMessage, getPastConversations, Message } from '../services/chatService';
import FormattedAIResponse from './FormattedAiResponse';
import { useAuth } from '../context/AuthContext';
import Chat from './Chat'; // Import the Chat component
import { useProgress } from '../context/AppContext';
import useLocalStorage from '../services/localHook';
import DOMPurify from 'dompurify';
import { marked } from 'marked'; // Ensure these are installed via npm or yarn
import posthog from 'posthog-js';
import { useLocation } from 'react-router-dom';
import { useSyllabusProgress } from '../services/useSyllabusProgress';

interface ChatInterfaceProps {
  code: string; // Function to get the current code from IDE

}


export interface ChatInterfaceRef {
  clearCode: () => void;
}


const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ code }, ref) => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPastConversations, setLoadingPastConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Move useSyllabusProgress call to the top level of the component
  const { handlePrevTopic: syllabusHandlePrevTopic, handleNextTopic: syllabusHandleNextTopic } = useSyllabusProgress();

  // Fix refresh logic - Critical part that was missing
  const location = useLocation();
  useEffect(() => {
    // Only refresh once and track it with localStorage
    if (location.state?.refresh && !localStorage.getItem("alreadyRefreshed")) {
      localStorage.setItem("alreadyRefreshed", "true");
      console.log("Refreshing ChatInterface due to location state");
      window.location.reload();
    } else if (!location.state?.refresh) {
      // Clear the flag when not coming from a refresh navigation
      localStorage.removeItem("alreadyRefreshed");
    }
  }, [location.state]);

  const username = localStorage.getItem('username');
  const { setShouldClearCode } = useAuth();
  
  const {currentSubtopic, setCurrentSubtopic, practiceMode, prompt: globalPrompt, setPrompt: clearGlobalPrompt, setPracticeMode} = useProgress();

  const { setHasClickedNextButton } = useProgress();

  const {setCurrentTopic} = useProgress();
  
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);


  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

 

  // Add a ref to track message fetch sessions
const messageFetchTokenRef = useRef<number>(0);
  useEffect(() => {

    if (currentSubtopic) {
      // When subtopic changes, cancel any ongoing message fetch by updating token and clear messages.
      messageFetchTokenRef.current++;
      setMessages([]);
      loadPastConversations();
    }
  }, [currentSubtopic]);
  
  useEffect(() => {
    if (practiceMode && globalPrompt) {
      setMessages([]);
      loadPastConversations();
      if (globalPrompt !== "don't send handlsend") {
        setTimeout(() => {
          handleSendMessage(globalPrompt);
        }, 1000);
        
      }
      clearGlobalPrompt('');
      console.log("currentSubtopic", currentSubtopic);
    }
  }, [practiceMode, globalPrompt, location.pathname]);
  
  const loadPastConversations = async () => {
    try {
      // Clear error state when attempting to load conversations
      setError(null);
      setLoadingPastConversations(true);

      // Clear messages state before fetching new messages
      setMessages([]);

      // Determine if this is a theory or challenge based on the ID format
      const isTheory = currentSubtopic?.includes('theory') || 
                      (localStorage.getItem('viewMode') === 'theory');
      
      // Add a temporary loading message
      const tempLoadingMessage: Message = {
        _id: 'loading_message_' + Date.now(),  // Make ID unique with timestamp
        user_id: '',
        userMessage: '',
        aiResponse: isTheory ? 
          "LLM is curating a personalized theory for you..." : 
          "Crafting a coding challenge for you...",
        timestamp: new Date().toISOString(),
      };
      
      setMessages([tempLoadingMessage]);
      
      const response = await getPastConversations(currentSubtopic);

      if (response.success) {
        let chats: Message[] = [];

        if (Array.isArray(response.data)) {
          chats = response.data;
        } else if (response.data && 'chats' in response.data) {
          chats = (response.data as { chats?: Message[] }).chats || [];
        }

        // Validate and sort the chats
        const validatedChats = chats.map(chat => ({
          _id: chat._id || Date.now().toString(),
          user_id: chat.user_id || chat.userId || '',
          userMessage: chat.userMessage || '',
          aiResponse: chat.aiResponse || '',
          timestamp: chat.timestamp || new Date().toISOString(),
        }));

        const sortedChats = validatedChats.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Update the messages state with the new chats
        if (sortedChats.length > 0) {
          setMessages(sortedChats);
        } else {
          // If we got no messages from the API but we're in a valid subtopic,
          // keep the loading message for a better UX
          setMessages([{
            ...tempLoadingMessage,
            aiResponse: isTheory ?
              "AI is preparing a personalized theory for you… Hold on!" :
              "AI is working hard for you… Hold on!"
          }]);
        }

      } else {
        console.error('Invalid response format:', response);
        // Keep the loading message but change it to an error state
        setMessages([{
          _id: 'error_message',
          user_id: '',
          userMessage: '',
          aiResponse: "Uh-oh! Please refresh the page to continue learning…",
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setMessages([{
        _id: 'error_message',
        user_id: '',
        userMessage: '',
        aiResponse: "Uh-oh! Please refresh the page to continue learning…",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoadingPastConversations(false);
    }
  };



const handleSendMessage = async (message: string) => {
  if (!message.trim() || isLoading) return;

  setIsLoading(true);
  setError(null);

  const newUserMessage: Message = {
    _id: Date.now().toString(),
    user_id: username || '',
    userMessage: message,
    aiResponse: "",
    timestamp: new Date().toISOString(),
  };

  setMessages(prev => [...prev, newUserMessage]);

  // Increment token for this fetch session and capture it.
  const token = ++messageFetchTokenRef.current;

  try {
    let backendMessage = message;

    if (code.trim()) {
      backendMessage = `${message}. (only refer to code if needed otherwise ignore code) Here is my code: ${code}`;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ message: backendMessage }),
    });

    if (!response.body) throw new Error("No response body");
    console.log("Response body:", response.body);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";

    while (true) {
      // If subtopic has changed, stop updating messages.
      if (token !== messageFetchTokenRef.current) break;

      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      buffer += chunk;
      fullResponse += chunk;

      if (token === messageFetchTokenRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === newUserMessage._id
              ? { ...msg, aiResponse: fullResponse }
              : msg
          )
        );

        // Scroll to bottom after each chunk update
        scrollToBottom();
      }
    }

    // Save full response on completion
    if (token === messageFetchTokenRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === newUserMessage._id
            ? { ...msg, aiResponse: fullResponse.trim() }
            : msg
        )
      );
    }
  } catch (err) {
    console.error("Error sending message:", err);
    setError("Failed to send message");
  } finally {
    if (token === messageFetchTokenRef.current) {
      setIsLoading(false);
    }
  }
};

// Add silent message sending functionality that doesn't display the user message
const handleSilentSendMessage = async (message: string) => {
  if (!message.trim() || isLoading) return;

  setIsLoading(true);
  setError(null);

  // No user message is added to UI here, unlike handleSendMessage
  
  // Increment token for this fetch session and capture it.
  const token = ++messageFetchTokenRef.current;

  try {
    let backendMessage = message;

    if (code.trim()) {
      backendMessage = `${message}. (only refer to code if needed otherwise ignore code) Here is my code: ${code}`;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ message: backendMessage }),
    });

    if (!response.body) throw new Error("No response body");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      if (token !== messageFetchTokenRef.current) break;

      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;

      if (token === messageFetchTokenRef.current) {
        // Replace the loading message with the AI response
        setMessages((prev) => {
          if (prev.length > 0 && prev[0]._id.includes('loading_message')) {
            return [{
              ...prev[0],
              aiResponse: fullResponse
            }];
          }
          return prev;
        });
        scrollToBottom();
      }
    }
  } catch (err) {
    console.error("Error sending silent message:", err);
    setError("Failed to load content");
  } finally {
    if (token === messageFetchTokenRef.current) {
      setIsLoading(false);
    }
  }
};

// Format the message with markdown support and sanitization
const formatMessage = (message: string): string => {
  // Ensure `marked.parse` returns a string
  const rawHTML = marked.parse(message); // Confirm `marked.parse` is synchronous in your environment
  
  if (typeof rawHTML !== "string") {
    throw new Error("Expected `marked.parse` to return a string.");
  }

  return DOMPurify.sanitize(rawHTML); // Sanitize HTML for security
};


  const handleSend = (message: string) => {
    handleSendMessage(message);
    posthog.capture('user_asked_ai_through_chat' , {
      user_message : message,
      subtopic : currentSubtopic
    });
    
  };

  // Add this state to check if topics exist
  const [topicsExist, setTopicsExist] = useState(false);
  
  // Improve the check for topics in localStorage
  useEffect(() => {
    const topics = localStorage.getItem('topics');
    try {
      const parsedTopics = topics ? JSON.parse(topics) : null;
      setTopicsExist(!!parsedTopics && Array.isArray(parsedTopics) && parsedTopics.length > 0);
      console.log("Topics exist:", !!parsedTopics && Array.isArray(parsedTopics) && parsedTopics.length > 0);
    } catch (error) {
      console.error("Error parsing topics from localStorage:", error);
      setTopicsExist(false);
    }
  }, []);

  // After successful navigation, trigger a rerender of the Navbar by updating localStorage
  const triggerBreadcrumbUpdate = useCallback(() => {
    // Update a timestamp to force component re-renders that depend on localStorage
    localStorage.setItem('breadcrumbLastUpdated', Date.now().toString());
  }, []);

  // Update handlePrevTopic and handleNextTopic to trigger breadcrumb updates
  const handlePrevTopic = async () => {
    if (!topicsExist) return; // Don't proceed if topics don't exist
    syllabusHandlePrevTopic(); // Use the method from the hook
    triggerBreadcrumbUpdate(); // Update breadcrumbs
  };

  const handleNextTopic = async () => {
    if (!topicsExist) return; // Don't proceed if topics don't exist
    syllabusHandleNextTopic(); // Use the hook method instead of manually setting flags
    triggerBreadcrumbUpdate(); // Update breadcrumbs
  };


  const handleButtonClick = async (buttonText: string) => {
    if(buttonText === 'I want to practice another example'){ // Handle button click event
      setShouldClearCode(true);
    }
    posthog.capture('user_asked_ai_through_button' , {
      user_message : buttonText,
      subtopic : currentSubtopic
    });
    handleSendMessage(buttonText); // Send the message with code
  };


  // Modify the getAIResponseMessage to handle string responses
  const getAIResponseMessage = (response: Message['aiResponse']): {
    aiResponse: string;
    timestamp: string;
  } => {
    let aiResponse: string;
    let timestamp: string;

    if (typeof response === 'string') {
      aiResponse = response;
      timestamp = new Date().toISOString();
    } else if (typeof response === 'object') {
      aiResponse = response.aiResponse || '';
      timestamp = response.timestamp || new Date().toISOString();
    } else {
      aiResponse = '';
      timestamp = new Date().toISOString();
    }

    return {
      aiResponse,
      timestamp,
    };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add effect to disable practice mode if user leaves the main page
  useEffect(() => {
    if (location.pathname !== '/main' && practiceMode) {
      setPracticeMode(false);
    }
  }, [location.pathname, practiceMode, setPracticeMode]);

  // Add effect to auto-send a message if needed
  useEffect(() => {
    // Check if we should auto-send a message (flag set by NewPage.tsx)
    const shouldAutoSendMessage = localStorage.getItem("shouldAutoSendMessage") === "true";
    
    if (shouldAutoSendMessage && currentSubtopic) {
      console.log("Auto-sending initial message for new subtopic (silent mode)");
      
      // Get subtopic details for a more personalized message
      const isTheory = localStorage.getItem('viewMode') === 'theory';
      let initialMessage = "";
      
      if (isTheory) {
        initialMessage = "Please explain the theory for this topic.";
      } else {
        initialMessage = "Please provide me with a coding challenge for this topic.";
      }
      
      // Clear the flag to prevent sending on subsequent renders
      localStorage.setItem("shouldAutoSendMessage", "false");
      
      // Use a slight delay to ensure everything is properly loaded
      setTimeout(() => {
        // Use the silent send function instead
        handleSilentSendMessage(initialMessage);
      }, 1000);
    }
  }, [currentSubtopic]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div key={msg._id} className={styles.messageWrapper}>
            {msg.userMessage && (
              <div className={styles.userMessage}>
                <p className={styles.messageContent}>{msg.userMessage}</p>
                <div className={styles.timestamp}>{formatTimestamp(msg.timestamp)}</div>
              </div>
            )}
            {msg.aiResponse && (
              <div>
                 <FormattedAIResponse
                response={{
                  aiResponse: msg.aiResponse,
                  timestamp: msg.timestamp,
                }}
              />

              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {topicsExist && (
        <div className={styles.buttonSection}>
        {/* First Row of Buttons */}
        <div className={styles.buttonRow}>
          <button className={`${styles.customButton} ${styles.button1}`} onClick={() => handleButtonClick("My code is not working.")}>
            My code is not working.
          </button>
          <button className={`${styles.customButton} ${styles.button2}`} onClick={() => handleButtonClick("I want to practice another example")}>
            I want to practice another example
          </button>
          <button className={`${styles.customButton} ${styles.button3}`} onClick={() => handleButtonClick("Need a hint 💡")}>
            Need a hint 💡
          </button>
        </div>
      </div>
      )}
      {!topicsExist && (
        <div className={styles.buttonSection}>
        {/* First Row of Buttons */}
        <div className={styles.buttonRow}>
          <button className={`${styles.customButton} ${styles.button1}`} onClick={() => handleButtonClick("Help me with my code")}>
            Help me with my code
          </button>
          <button className={`${styles.customButton} ${styles.button2}`} onClick={() => handleButtonClick("Move to next challenge")}>
            Move to next challenge
          </button>
          <button className={`${styles.customButton} ${styles.button3}`} onClick={() => handleButtonClick("Need a hint 💡")}>
            Need a hint 💡
          </button>
        </div>
      </div>
      )}
      <div className={styles.chatComponent}><Chat onSend={handleSend} /></div>
      
      {/* Only render navigation buttons if topics exist */}
      {topicsExist && (
        <div className={styles.navbuttonrow}>
          <button 
            className={`${styles.navButton} ${styles.button1}`} 
            onClick={handlePrevTopic}
          >
            Prev
          </button>
          <button 
            className={`${styles.navButton} ${styles.button2}`} 
            onClick={handleNextTopic}
          >
            Next
          </button>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );



});


export default ChatInterface;