import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSWConfig } from '@/lib/pwa/swConfig';

// Force bundle refresh: 2025-12-02-01:29
// This comment changes the file content to generate a new vendor bundle hash

// Security: Escape HTML entities to prevent XSS in error messages
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
// Verify React is loaded correctly
if (!React || !React.createElement || !React.createContext) {
  console.error('CRITICAL: React is not loaded correctly!', {
    React,
    hasCreateElement: !!React?.createElement,
    hasCreateContext: !!React?.createContext,
  });
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
      <div>
        <h1 style="color: #ef4444; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #6b7280; margin-bottom: 8px;">React library failed to load. Please try:</p>
        <ol style="color: #6b7280; text-align: left; display: inline-block;">
          <li>Clear your browser cache</li>
          <li>Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)</li>
          <li>Check your internet connection</li>
        </ol>
        <p style="color: #9ca3af; margin-top: 16px; font-size: 14px;">Error: React.createContext is undefined</p>
      </div>
    </div>
  `;
  throw new Error('React failed to load');
}

// Standard React 18 entrypoint with StrictMode
const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('App mounted successfully');

    // Initialize service worker config storage for offline sync
    initSWConfig();
  } catch (error) {
    console.error('Failed to mount React app:', error);
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
        <div>
          <h1 style="color: #ef4444; margin-bottom: 16px;">Application Mount Error</h1>
          <p style="color: #6b7280; margin-bottom: 8px;">Failed to start the application.</p>
          <p style="color: #9ca3af; font-size: 14px;">${escapeHtml(error instanceof Error ? error.message : 'Unknown error')}</p>
          <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
} else {
  // Fallback in case #root is missing
  console.error('Root element with id "root" not found');
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
      <div>
        <h1 style="color: #ef4444; margin-bottom: 16px;">Configuration Error</h1>
        <p style="color: #6b7280;">Root element not found in HTML.</p>
      </div>
    </div>
  `;
}
