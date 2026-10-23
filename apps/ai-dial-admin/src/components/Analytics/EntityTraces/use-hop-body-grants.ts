'use client';

import { useEffect, useRef, useState } from 'react';

import { getHopBodyGrants } from '@/src/app/[lang]/sessions/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { HopBodyGrants } from '@/src/models/analytics/sessions-trace';

const NO_GRANTS: HopBodyGrants = { isRequestReadable: false, isResponseReadable: false };

/**
 * Which hop bodies this account may read. The session page resolves it on the server before it renders; an
 * Audit tab renders on the client, so it asks once on mount. Until it answers — and if it fails — nothing is
 * granted, which is the side to be wrong on: a withheld tab states that it is withheld.
 */
export const useHopBodyGrants = (): HopBodyGrants => {
  const [grants, setGrants] = useState<HopBodyGrants>(NO_GRANTS);
  const getReqRef = useRef(useProtectedRequest());

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      try {
        const result = await getReqRef.current(getHopBodyGrants);
        if (isCurrent && result?.success && result.response) {
          setGrants(result.response);
        }
      } catch {
        // Already the safe default.
      }
    };

    void load();

    return () => {
      isCurrent = false;
    };
  }, []);

  return grants;
};
