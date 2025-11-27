/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Light theme colors (Requirements 2.1, 2.2)
        light: {
          bg: {
            DEFAULT: '#ffffff',      // Main container background
            primary: '#ffffff',      // Primary light background
            secondary: '#f8fafc',    // Secondary background
            card: '#ffffff',         // Card background
            elevated: '#f1f5f9',     // Elevated surfaces
          },
          text: {
            primary: '#0f172a',      // Primary text (dark slate)
            secondary: '#334155',    // Secondary text
            muted: '#64748b',        // Muted text
          },
          border: {
            DEFAULT: '#e2e8f0',      // Default borders
            light: '#f1f5f9',        // Light borders
          },
          accent: {
            cyan: '#0891b2',         // Darker cyan for light mode
            yellow: '#d97706',       // Darker yellow for light mode
            coral: '#ea580c',        // Darker coral for light mode
          },
        },
        sparks: {
          // Dark theme backgrounds (Requirements 7.1, 7.2)
          bg: {
            DEFAULT: '#0a0a0f',      // Main container background
            primary: '#0a0a0f',      // Primary dark background
            card: '#12121a',         // Card/section background (slightly lighter)
            elevated: '#1a1a24',     // Elevated surfaces
          },
          // Category colors (Requirements 2.3, 4.4, 6.3)
          cyan: {
            DEFAULT: '#22d3ee',      // Social category, Active status, Primary accent
            light: '#67e8f9',        // Lighter variant
            dark: '#0891b2',         // Darker variant
          },
          yellow: {
            DEFAULT: '#fbbf24',      // Marketing category, Expiring status
            light: '#fcd34d',        // Lighter variant
            dark: '#d97706',         // Darker variant
          },
          coral: {
            DEFAULT: '#f97316',      // Product category, Low CTR status
            light: '#fb923c',        // Lighter variant
            dark: '#ea580c',         // Darker variant
          },
          // Text colors (Requirements 7.3)
          text: {
            primary: '#ffffff',      // Primary text (white)
            secondary: '#a1a1aa',    // Secondary/muted text (gray)
            muted: '#64748b',        // Muted text (slate)
          },
          // Border colors (Requirements 7.2)
          border: {
            DEFAULT: 'rgba(255, 255, 255, 0.05)',  // Subtle borders
            light: 'rgba(255, 255, 255, 0.1)',    // Slightly visible borders
          },
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        indigo: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        }
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
