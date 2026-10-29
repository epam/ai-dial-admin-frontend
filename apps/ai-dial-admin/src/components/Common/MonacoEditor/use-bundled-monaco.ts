import { useEffect, useState } from 'react';

import { getLoadedMonaco, loadMonaco, setMonacoTranslate } from '@/src/components/Common/MonacoEditor/load-monaco';
import { useCurrentLocale, useI18n } from '@/src/locales/client';

/**
 * Loads the bundled Monaco in the app locale and reports when an editor may mount. Loading happens in an
 * effect, so Monaco never runs during server rendering.
 */
export const useBundledMonaco = (): boolean => {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [isReady, setIsReady] = useState(() => getLoadedMonaco() != null);

  useEffect(() => {
    setMonacoTranslate(t);
  }, [t]);

  useEffect(() => {
    if (isReady) return;

    let isActive = true;
    const load = async () => {
      try {
        await loadMonaco(locale);
        if (isActive) setIsReady(true);
      } catch (error) {
        console.error('Monaco failed to load', error);
      }
    };
    void load();

    return () => {
      isActive = false;
    };
  }, [isReady, locale]);

  return isReady;
};
