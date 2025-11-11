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

// Ensure proper hash-based routing for SPA
if (window.location.pathname !== '/' && !window.location.hash) {
  window.location.replace('/#' + window.location.pathname + window.location.search)
}

createRoot(document.getElementById("root")!).render(<App />);
