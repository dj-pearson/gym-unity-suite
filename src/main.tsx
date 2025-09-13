import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Redirect non-hash deep links to hash-based routes for reliable SPA routing in static environments
if (!window.location.hash && window.location.pathname !== '/') {
  const newHash = '#' + window.location.pathname + window.location.search + window.location.hash
  window.location.replace(newHash)
}

createRoot(document.getElementById("root")!).render(<App />);
