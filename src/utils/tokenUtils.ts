// src/utils/tokenUtils.ts
import { auth } from '../services/firebase';

/**
 * Checks if the current Firebase authentication token is valid
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    // Get current user
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return false;
    }
    
    // Force token refresh to ensure it's valid
    await currentUser.getIdToken(true);
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Checks the token expiry from localStorage
 * @returns boolean - True if token exists and isn't expired
 */
export function isLocalTokenValid(): boolean {
  const token = localStorage.getItem('token');
  const tokenTimestamp = localStorage.getItem('tokenTimestamp');
  
  if (!token || !tokenTimestamp) {
    return false;
  }
  
  const now = Date.now();
  const timestamp = parseInt(tokenTimestamp, 10);
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  
  // If token is older than 1 hour, consider it expired
  return now - timestamp < ONE_HOUR;
}

/**
 * Sets a token in localStorage with timestamp
 * @param token - The authentication token to store
 */
export function setTokenWithTimestamp(token: string): void {
  localStorage.setItem('token', token);
  localStorage.setItem('tokenTimestamp', Date.now().toString());
}
