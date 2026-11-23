import { useEffect, useRef, useState } from 'react';

import { getModelsListAction } from '@/src/app/[lang]/models/actions';

export const useModelSuggestions = (isActive: boolean): string[] => {
  const hasStartedRef = useRef(false);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const load = async () => {
      try {
        const read = await getModelsListAction();

        if (read.success) {
          setModels((read.response ?? []).flatMap(({ name }) => (name ? [name] : [])));
        }
      } catch {
        setModels([]);
      }
    };

    void load();
  }, [isActive]);

  return models;
};
