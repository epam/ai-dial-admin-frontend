import { useCallback } from 'react';

const SCROLL_POLL_INTERVAL_MS = 500;
const SCROLL_MAX_ATTEMPTS = 20;

/** The selected row mounts only after the folder data loads, so poll for it instead of scrolling once. */
export const useScrollSelectedFolder = () =>
  useCallback(() => {
    let attempts = 0;
    const scrollInterval = setInterval(() => {
      const selectedElement = document.querySelector('[role="tree"] [aria-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        clearInterval(scrollInterval);
      } else if (attempts >= SCROLL_MAX_ATTEMPTS) {
        clearInterval(scrollInterval);
      }
      attempts++;
    }, SCROLL_POLL_INTERVAL_MS);
  }, []);
