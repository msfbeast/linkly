import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handler for chunk load failures (version mismatch)
window.addEventListener('error', (e) => {
  // Check if the error is a chunk load failure
  if (/Loading chunk [\d]+ failed/.test(e.message) || /Failed to fetch dynamically imported module/.test(e.message)) {
    console.error('Chunk load failed, reloading...', e);
    // Force reload to get new index.html
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);