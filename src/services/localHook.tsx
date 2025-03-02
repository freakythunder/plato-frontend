import { useState, useEffect } from 'react';

const useLocalStorage = (key: string) => {
  const [value, setValue] = useState(() => localStorage.getItem(key));

  useEffect(() => {
    // Function to update the state when localStorage changes
    const updateValue = () => {
      setValue(localStorage.getItem(key));
    };

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', updateValue);

    // Poll for changes in the same tab (optional, for reliability)
    const interval = setInterval(() => {
      if (localStorage.getItem(key) !== value) {
        updateValue();
      }
    }, 10); // Adjust the polling frequency as needed

    return () => {
      window.removeEventListener('storage', updateValue);
      clearInterval(interval);
    };
  }, [key, value]);

  return value;
};

export default useLocalStorage;
