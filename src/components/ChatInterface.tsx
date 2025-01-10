// src/components/ChatInterface.tsx
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '../Styles/ChatInterface.module.css';
import { sendMessage, getPastConversations, Message } from '../services/chatService';
import FormattedAIResponse from './FormattedAiResponse';
import { useAuth } from '../context/AuthContext';
import Chat from './Chat'; // Import the Chat component
import { useProgress } from '../context/AppContext';
import useLocalStorage from '../services/localHook';
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
  const { welcomeMessage, clearWelcomeMessage } = useAuth();
  const token = localStorage.getItem('token');
  const username = token ? JSON.parse(atob(token.split('.')[1])).username : null;
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
  console.log("from chatinterface : ", currentSubtopic);

  useEffect(() => {
    console.log('useEffect triggered:', currentSubtopic);
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

    // Store only the clean message in the userMessage
    const newUserMessage: Message = {
      _id: Date.now().toString(),
      user_id: username || '',
      userMessage: message, // This remains "I need hint for this challenge"
      aiResponse: "AI is thinking...",
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Append the code only for backend processing
      let backendMessage;

      // Check if the message is "Let's move on to the next topic!"
      if (message === "My code is not working.") {
        if (!code.trim()) {
          // If code is empty, send the message directly
          backendMessage = message; // Send the message as is
        } else {
          // Append the code only for backend processing for other messages
          backendMessage = `${message}. Here is my code: ${code}`;
        }
      } else {
        backendMessage = message; // Don't append code for other messages
      }


      const response = await sendMessage(backendMessage);
      if (response.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === newUserMessage._id
              ? {
                ...msg,
                aiResponse: response.data.aiResponse || "No response",
                timestamp: new Date().toISOString(),
              }
              : msg
          )
        );


      } else {
        setError(response.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
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
                <FormattedAIResponse response={getAIResponseMessage(msg.aiResponse)} />
                
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