// src/components/ChatInterface.tsx
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '../Styles/ChatInterface.module.css';
import { sendMessage, getPastConversations, Message } from '../services/chatService';
import FormattedAIResponse from './FormattedAiResponse';
import { useAuth } from '../context/AuthContext';


export interface ChatInterfaceRef {
  addMessage: (message: string) => void;
}



const ChatInterface = forwardRef<ChatInterfaceRef>((_, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { welcomeMessage, clearWelcomeMessage } = useAuth();
  const token = localStorage.getItem('token');
  const username = token ? JSON.parse(atob(token.split('.')[1])).username : null;

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

  useImperativeHandle(ref, () => ({
    addMessage(message: string) {
      handleSendMessage(message);
    },
  }));

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
    const normalizedMessage = message.trim().toLowerCase();

    // Create a new user message
    let userMessageContent = message; // Default to the input message
  
    if (normalizedMessage === "next") {
      userMessageContent = "Next";
    } else if (normalizedMessage === "let's begin") {
      userMessageContent = "Let's begin";
    } else {
      userMessageContent = "Need help";
    }
    // Create a new user message
    const newUserMessage: Message = {
      _id: Date.now().toString(),
      user_id: username || '',
      userMessage: userMessageContent,
      aiResponse: "",
      timestamp: new Date().toISOString(),
    };
  
    // Check if the message starts with "Next"
    
    // Add the user message to the state immediately
    setMessages(prev => [...prev, newUserMessage]);
  
    try {
      // Send the message to the AI
      const response = await sendMessage(message);
  
      if (response.success) {
        // Update the AI response in the state
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
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
  
      // Update the message with an error response
      setMessages(prev =>
        prev.map(msg =>
          msg._id === newUserMessage._id
            ? {
                ...msg,
                aiResponse: "Error: Failed to get response",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
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
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
});

export default ChatInterface;