// src/services/chatService.ts
import api from './api';

// src/services/chatService.tsx

// src/services/chatService.tsx

export interface Message {
  _id: string;
  user_id: string;
  userId? : string;
  userMessage: string;
  aiResponse: string | {
    user_id?: string | null;
    userMessage?: string;
    aiResponse?: string;
    timestamp?: string;
  };
  timestamp: string;
}


interface SingleMessageResponse {
  success: boolean;
  data: {
    aiResponse: string;
  };
  message: string;
}

interface PastConversationsResponse {
  success: boolean;
  data: Message[] | { chats?: Message[] };
  message?: string;
}
export const sendMessage = async (message: string): Promise<SingleMessageResponse> => {
  try {
    const response = await api.post('/chat/send', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
export const getPastConversations = async (): Promise<PastConversationsResponse> => {
  try {
    const subtopicId = localStorage.getItem('currentSubtopic');
    
    const response = await api.get('/chat/past', {
      params: {
        subtopicId,

      },
    });
    
    // Add logging to verify the exact response structure
    console.log('Raw API response:', response);
    console.log('Response data:', response.data);
    
    // Type assertion to ensure correct structure
    return response.data as PastConversationsResponse;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};