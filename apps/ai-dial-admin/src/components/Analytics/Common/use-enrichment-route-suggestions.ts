import { useEffect, useRef, useState } from 'react';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import { EnrichmentRouteSuggestions } from '@/src/models/analytics/enrichment-routes';
import { toRouteSuggestions } from '@/src/utils/analytics/enrichment-routes';

const NO_SUGGESTIONS: EnrichmentRouteSuggestions = { deployments: [], routesByDeployment: {} };

export const useEnrichmentRouteSuggestions = (isActive: boolean): EnrichmentRouteSuggestions => {
  const hasStartedRef = useRef(false);
  const [suggestions, setSuggestions] = useState(NO_SUGGESTIONS);

  useEffect(() => {
    if (!isActive || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const load = async () => {
      try {
        const read = await getApplications();

        if (read.success) {
          setSuggestions(toRouteSuggestions(read.response));
        }
      } catch {
        setSuggestions(NO_SUGGESTIONS);
      }
    };

    void load();
  }, [isActive]);

  return suggestions;
};
