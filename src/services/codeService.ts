// src/services/codeService.ts
import api from './api';

export const executeCode = async (code: string) => {
  try {
    const response = await api.post('/code/execute', { code });
    return response.data;
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
};

// Add more code-related API calls here as needed