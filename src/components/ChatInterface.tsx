// src/components/ChatInterface.tsx
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '../Styles/ChatInterface.module.css';
import { sendMessage, getPastConversations, Message } from '../services/chatService';
import FormattedAIResponse from './FormattedAiResponse';
import { useAuth } from '../context/AuthContext';
import Chat from './Chat'; // Import the Chat component


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


  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    loadPastConversationsAndWelcomeMessage();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);



  const loadPastConversationsAndWelcomeMessage = async () => {
    try {
      const response = await getPastConversations();

      let chats: Message[] = [];
      if (response.success) {

        if (Array.isArray(response.data)) {
          chats = response.data;
        }
        else if (response.data && 'chats' in response.data) {
          chats = (response.data as { chats?: Message[] }).chats || [];
        }

        const validatedChats = chats.map(chat => ({
          _id: chat._id || Date.now().toString(),
          user_id: chat.user_id || chat.userId || '',
          userMessage: chat.userMessage || '',
          aiResponse: chat.aiResponse || '',
          timestamp: chat.timestamp || new Date().toISOString()
        }));

        const sortedChats = validatedChats.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setMessages(sortedChats);

        if (welcomeMessage) {
          const welcomeMsg: Message = {
            _id: Date.now().toString(),
            user_id: 'AI',
            userMessage: '',
            aiResponse: welcomeMessage,
            timestamp: new Date().toISOString()
          };

          // Add welcome message and clear it from context
          setMessages(prev => [...prev, welcomeMsg]);
          clearWelcomeMessage();
        }


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
      if (message === "Let's move on to the next sub-topic!" || message === "I want to practice another example") {
        backendMessage = message; // Send the message as is
      } else {
        // Append the code only for backend processing for other messages
        backendMessage = `${message}. Here is my code: ${code}`;
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

 


  const handleButtonClick = async (buttonText: string) => {
    if (buttonText === "Let's move on to the next sub-topic!" || buttonText === "I want to practice another example") {
      setShouldClearCode(true); // Set the variable to true when the button is clicked
      console.log("set to true from chat");

    }
    handleSendMessage(buttonText); // Send the message with code
  };
  // Modify the getAIResponseMessage to handle string responses
  const getAIResponseMessage = (response: Message['aiResponse']): {
    user_id?: string;
    userMessage?: string;
    aiResponse: string;
    timestamp: string;
  } => {
    // If response is already a string, return it directly
    if (typeof response === 'string') {
      return {
        user_id: 'AI',
        userMessage: '',
        aiResponse: response,
        timestamp: new Date().toISOString()
      };
    }

    // If it's an object, try to extract aiResponse or userMessage
    if (typeof response === 'object') {
      return {
        user_id: response.user_id || 'AI',
        userMessage: response.userMessage || '',
        aiResponse: response.aiResponse || '',
        timestamp: response.timestamp || new Date().toISOString()
      };
    }

    // Fallback to empty string
    return {
      user_id: 'AI',
      userMessage: '',
      aiResponse: '',
      timestamp: new Date().toISOString()
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
              <div className={styles.aiMessage}>
                <FormattedAIResponse response={getAIResponseMessage(msg.aiResponse)} />
                <div className={styles.timestamp}>{formatTimestamp(msg.timestamp)}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.buttonSection}>
        {/* First Row of Buttons */}
        <div className={styles.buttonRow}>
          <button className={`${styles.customButton} ${styles.button1}`} onClick={() => handleButtonClick("I am getting an error.")}>
            I am getting an error.
          </button>
          <button className={`${styles.customButton} ${styles.button2}`} onClick={() => handleButtonClick("I want to practice another example")}>
            I want to practice another example
          </button>
        </div>
        <div className={styles.buttonRow}>
          <button className={`${styles.customButton} ${styles.button3}`} onClick={() => handleButtonClick("Let's move on to the next sub-topic!")}>
            Let's move on to the next sub-topic!
          </button>
          <button className={`${styles.customButton} ${styles.button4}`} onClick={() => handleButtonClick("I need hint for this challenge")}>
            I need hint for this challenge
          </button>
        </div>
      </div>
      <Chat onSend={handleSend} />
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );

});


export default ChatInterface;