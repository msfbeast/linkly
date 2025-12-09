import React, { createContext, useContext, useEffect, ReactNode } from 'react';

/**
 * Theme type - light mode only
 */
export type Theme = 'light';

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
 * Provides light theme throughout the app
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Ensure dark class is removed
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const value: ThemeContextType = {
    theme: 'light',
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
