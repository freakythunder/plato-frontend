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
  conversationsFound?: boolean; // Added to indicate if conversations were found
}

// Add a flag to track if a request is in progress
let isPastConversationsRequestInProgress = false;

export const sendMessage = async (message: string): Promise<SingleMessageResponse> => {
  try {
    const response = await api.post('/chat/send', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
export const getPastConversations = async (currentSubtopic: string): Promise<PastConversationsResponse> => {
  // Check if a request is already in progress
  if (isPastConversationsRequestInProgress) {
    console.log('A request is already in progress, skipping this call');
    throw new Error('A request to fetch past conversations is already in progress');
  }
  
  try {
    // Set the flag to indicate a request is in progress
    isPastConversationsRequestInProgress = true;
    
    const subtopicId = currentSubtopic;
    const language = localStorage.getItem('language');
    const backendlanguage = language.toLowerCase();
    
    // Extract indexes from subtopicId
    const parts = subtopicId.split('_');
    const referenceLang = parts[0];
    const type = parts[1]; // 'subtopic' or 'challenge'
    const allTopicsString = localStorage.getItem('allTopics');
    console.log('parts:', parts);
    console.log('allTopicsString:', allTopicsString);
    console.log('referenceLang:', referenceLang);

    let description = "";
    
    if (allTopicsString) {
      const allTopicsArray = JSON.parse(allTopicsString);
      console.log('allTopicsArray:', allTopicsArray);
      
      // Find the correct language entry in allTopics
      const languageEntry = allTopicsArray.find(
        (entry) => entry.language.toLowerCase() === language.toLowerCase()
      );
      
      if (languageEntry && languageEntry.topics) {
        const allTopics = languageEntry.topics;
        console.log('Language specific topics:', allTopics);
        
        if (type === 'subtopic') {
          // Format: ${referenceLang}_subtopic_${topicIndex+1}_${subtopicIndex+1}
          const topicIndex = parseInt(parts[2]) - 1;
          const subtopicIndex = parseInt(parts[3]) - 1;
          console.log('topicIndex:', topicIndex);
          console.log('subtopicIndex:', subtopicIndex);
          
          // Fixed condition to properly check array access regardless of index value
          if (topicIndex >= 0 && 
              subtopicIndex >= 0 && 
              allTopics[topicIndex] !== undefined && 
              allTopics[topicIndex].subtopics[subtopicIndex] !== undefined) {
            description = allTopics[topicIndex].subtopics[subtopicIndex].description || "";
            console.log('description:', description);
          }
        } else if (type === 'challenge') {
          // Format: ${referenceLang}_challenge_${topicIndex+1}_${subtopicIndex+1}_${challengeIndex+1}
          const topicIndex = parseInt(parts[2]) - 1;
          const subtopicIndex = parseInt(parts[3]) - 1;
          const challengeIndex = parseInt(parts[4]) - 1;
          console.log('topicIndex:', topicIndex);
          console.log('subtopicIndex:', subtopicIndex);
          console.log('challengeIndex:', challengeIndex);
          
          // Fixed condition to properly check array access regardless of index value
          if (topicIndex >= 0 && 
              subtopicIndex >= 0 && 
              challengeIndex >= 0 &&
              allTopics[topicIndex] !== undefined && 
              allTopics[topicIndex].subtopics[subtopicIndex] !== undefined && 
              allTopics[topicIndex].subtopics[subtopicIndex].challenges[challengeIndex] !== undefined) {
            description = allTopics[topicIndex].subtopics[subtopicIndex].challenges[challengeIndex].description || "";
            console.log('description:', description);
          }
        }
      }
    }
    
    const response = await api.get('/chat/past', {
      params: {
        subtopicId,
        backendlanguage,
        description
      },
    });
    
    // Add logging to verify the exact response structure
    console.log('Raw API response:', response);
    console.log('Response data:', response.data);
    
    // Determine if conversations were found
    let conversationsFound = false;
    if (response.data.success) {
      let chats: Message[] = [];
      if (Array.isArray(response.data.data)) {
        chats = response.data.data;
      } else if (response.data.data && 'chats' in response.data.data) {
        chats = (response.data.data as { chats?: Message[] }).chats || [];
      }
      conversationsFound = chats.length > 0;
    }
    
    // Return with the additional flag
    return {
      ...response.data,
      conversationsFound
    } as PastConversationsResponse;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  } finally {
    // Reset the flag when the request completes (success or failure)
    isPastConversationsRequestInProgress = false;
  }
};