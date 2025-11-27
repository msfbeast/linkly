import React, { createContext, useContext, useEffect, ReactNode } from 'react';

/**
 * Theme type - dark mode only
 */
export type Theme = 'dark';

/**
 * Theme Context Type
 */
export interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Provides dark theme throughout the app
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always apply dark mode class
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const value: ThemeContextType = {
    theme: 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
