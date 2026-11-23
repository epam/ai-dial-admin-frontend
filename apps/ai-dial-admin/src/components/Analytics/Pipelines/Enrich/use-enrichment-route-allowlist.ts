import { useEffect, useRef, useState } from 'react';

import { getEnrichmentRoutes } from '@/src/app/[lang]/system-properties/actions';
import { EnrichmentRouteAllowlist, EnrichmentRoutesReadState } from '@/src/models/analytics/enrichment-routes';

const UNKNOWN: EnrichmentRouteAllowlist = { state: EnrichmentRoutesReadState.Unknown, routes: [] };

export const useEnrichmentRouteAllowlist = (isActive: boolean): EnrichmentRouteAllowlist => {
  const hasStartedRef = useRef(false);
  const [allowlist, setAllowlist] = useState(UNKNOWN);

  useEffect(() => {
    if (!isActive || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const load = async () => {
      try {
        const read = await getEnrichmentRoutes();

        if (read.success) {
          setAllowlist({
            state: read.response ? EnrichmentRoutesReadState.Listed : EnrichmentRoutesReadState.NotStored,
            routes: read.response ?? [],
          });
        }
      } catch {
        setAllowlist(UNKNOWN);
      }
    };

    void load();
  }, [isActive]);

  return allowlist;
};
