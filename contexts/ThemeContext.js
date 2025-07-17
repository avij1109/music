// contexts/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider component
export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme(); // 'dark' or 'light'
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === 'dark');

  const toggleTheme = () => {
    setIsDarkMode(previousState => !previousState);
  };

  const value = {
    isDarkMode,
    toggleTheme, // We can use this instead of setIsDarkMode directly
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 3. Create a custom hook for easy use
export const useTheme = () => useContext(ThemeContext);