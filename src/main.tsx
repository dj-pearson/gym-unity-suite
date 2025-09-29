import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Sanitize: remove any stray literal "\\n" text nodes injected before React mounts
;(() => {
  try {
    const nodes = Array.from(document.body.childNodes);
    for (const n of nodes) {
      if (n.nodeType === Node.TEXT_NODE && n.textContent) {
        const cleaned = n.textContent.replace(/\\n/g, "").trim();
        if (cleaned.length === 0) {
          document.body.removeChild(n);
        } else if (cleaned !== n.textContent) {
          n.textContent = cleaned;
        }
      }
    }
  } catch (e) {
    // no-op
  }
})();

// Redirect non-hash deep links to hash-based routes for reliable SPA routing in static environments
if (!window.location.hash && window.location.pathname !== '/') {
  const newHash = '#' + window.location.pathname + window.location.search + window.location.hash
  window.location.replace(newHash)
}

createRoot(document.getElementById("root")!).render(<App />);
