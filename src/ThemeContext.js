import React, { createContext, useState, useEffect } from 'react';

// Create a context for theme
export const ThemeContext = createContext();

// Theme provider component
export function ThemeProvider({ children }) {
  // Attempt to load the theme from localStorage, default to 'light'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Update localStorage whenever theme changes.
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle between 'light' and 'dark'
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
