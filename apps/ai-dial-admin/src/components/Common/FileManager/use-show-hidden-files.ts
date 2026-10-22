import { useCallback, useEffect, useState } from 'react';

import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX } from './constants';

export const useShowHiddenFiles = (view: string): [boolean, (value: boolean) => void] => {
  const storageKey = `${SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX}:${view}`;
  const [isShown, setIsShown] = useState(false);

  // Read after mount so the server-rendered markup and the first client render agree.
  useEffect(() => {
    try {
      setIsShown(getFromLocalStorage(storageKey) === 'true');
    } catch {
      setIsShown(false);
    }
  }, [storageKey]);

  const onChange = useCallback(
    (value: boolean) => {
      setIsShown(value);
      try {
        setToLocalStorage(storageKey, String(value));
      } catch {
        // Storage can be unavailable (private mode, quota); the choice then lasts for this page only.
      }
    },
    [storageKey],
  );

  return [isShown, onChange];
};
