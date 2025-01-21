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
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const username = localStorage.getItem('username');
  const { setShouldClearCode } = useAuth();


  const { setHasClickedNextButton } = useProgress();


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

  const currentSubtopic = useLocalStorage('currentSubtopic');


  useEffect(() => {

    if (currentSubtopic) {
      setMessages([]);
      loadPastConversations();
    }
  }, [currentSubtopic]);

  const loadPastConversations = async () => {
    try {


      // Clear messages state before fetching new messages
      setMessages([]);

      const response = await getPastConversations();

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
        setMessages(sortedChats);

      } else {
        console.error('Invalid response format:', response);
        setError(response.message || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load past conversations');
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

  try {
    let backendMessage = message;

    if (message === "My code is not working." && code.trim()) {
      backendMessage = `${message}. Here is my code: ${code}`;
    }

    const response = await fetch("http://localhost:5000/chat/send", {
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
    let buffer = "";
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      buffer += chunk;
      fullResponse += chunk;

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

    // Save full response on completion
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === newUserMessage._id
          ? { ...msg, aiResponse: fullResponse.trim() }
          : msg
      )
    );
  } catch (err) {
    console.error("Error sending message:", err);
    setError("Failed to send message");
  } finally {
    setIsLoading(false);
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
  };


  const handlePrevTopic = async () => {
    console.log("prev topic clicked");
    const currentSubtopic = localStorage.getItem('currentSubtopic');
    const topics = JSON.parse(localStorage.getItem('topics'));
    const currentTopic = topics.find((t) => t.subtopics.find((st) => st.name === currentSubtopic));
    const currentSubtopicIndex = currentTopic.subtopics.indexOf(currentTopic.subtopics.find((st) => st.name === currentSubtopic));
    if (currentSubtopicIndex > 0) {
      const previousSubtopic = currentTopic.subtopics[currentSubtopicIndex - 1];
      if (previousSubtopic.completed) {
        setShouldClearCode(true);
        setMessages([]);
        localStorage.setItem('currentSubtopic', previousSubtopic.name);
      }
    }
    else {
      const currentTopicindex = topics.indexOf(currentTopic);
      const prevtopicIndex = currentTopicindex - 1;
      const previousSubtopic = topics[prevtopicIndex].subtopics[topics[prevtopicIndex].subtopics.length - 1];
      if (previousSubtopic.completed) {
        setShouldClearCode(true);
        setMessages([]);
        localStorage.setItem('currentSubtopic', previousSubtopic.name);
      }
    }
  };

  const handleNextTopic = async () => {
    const currentSubtopic = localStorage.getItem('currentSubtopic');
    const topics = JSON.parse(localStorage.getItem('topics'));
    const currentTopic = topics.find((t) => t.subtopics.find((st) => st.name === currentSubtopic));
    const currentSubtopicIndex = currentTopic.subtopics.indexOf(currentTopic.subtopics.find((st) => st.name === currentSubtopic));

    if (currentTopic.subtopics[currentSubtopicIndex].completed) {
      // Find the next subtopic
      if (currentSubtopicIndex < currentTopic.subtopics.length - 1) {
        // Next subtopic is within the same topic
        const nextSubtopic = currentTopic.subtopics[currentSubtopicIndex + 1];
        setMessages([]);
        localStorage.setItem('currentSubtopic', nextSubtopic.name);
        setShouldClearCode(true);
      } else {
        // Current subtopic is the last one in the topic, move to next topic
        const nextTopicIndex = topics.indexOf(currentTopic) + 1;
        if (nextTopicIndex < topics.length) {
          const nextTopic = topics[nextTopicIndex];
          const nextSubtopic = nextTopic.subtopics[0]; // First subtopic of the next topic    
          setMessages([]);
          localStorage.setItem('currentSubtopic', nextSubtopic.name);
          setShouldClearCode(true);
        }
      }
    }
    else {
      setHasClickedNextButton(true);
    }
  };


  const handleButtonClick = async (buttonText: string) => {
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
      <div className={styles.chatComponent}><Chat onSend={handleSend} /></div>
      <div className={styles.navbuttonrow}>
        <button className={`${styles.navButton} ${styles.button1}`} onClick={handlePrevTopic}>
          Prev
        </button>
        <button className={`${styles.navButton} ${styles.button2}`} onClick={handleNextTopic}>
          Next
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );

});


export default ChatInterface;