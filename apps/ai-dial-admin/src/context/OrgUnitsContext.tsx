'use client';
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { getOrgUnits } from '@/src/app/[lang]/folders-storage/actions';
import { OrgUnit, OrgUnitsStatus } from '@/src/models/dial/org-unit';
import { getOwningUnit as findOwningUnit, toUnitMap } from '@/src/utils/org-units/units';

export interface OrgUnitsContextType {
  /** Units keyed by normalised `folder`. */
  units: Record<string, OrgUnit>;
  unitsStatus: OrgUnitsStatus;
  groupClaim: string;
  /** Loads the units on first call only; later calls are no-ops until `refreshUnits`. */
  ensureUnits: () => void;
  refreshUnits: () => Promise<void>;
  getOwningUnit: (path: string) => OrgUnit | undefined;
}

const OrgUnitsContext = createContext<OrgUnitsContextType | undefined>(undefined);

const DEFAULT_GROUP_CLAIM = 'groups';

interface Props {
  children: ReactNode;
  groupClaim?: string;
}

export const OrgUnitsProvider = ({ children, groupClaim = DEFAULT_GROUP_CLAIM }: Props) => {
  const [units, setUnits] = useState<Record<string, OrgUnit>>({});
  const [unitsStatus, setUnitsStatus] = useState(OrgUnitsStatus.IDLE);
  const hasRequestedUnits = useRef(false);

  const refreshUnits = useCallback(async () => {
    hasRequestedUnits.current = true;
    setUnitsStatus(OrgUnitsStatus.LOADING);
    try {
      const res = await getOrgUnits();
      if (res.success) {
        setUnits(toUnitMap(res.response?.items ?? []));
        setUnitsStatus(OrgUnitsStatus.READY);
      } else if (res.status === 404 || res.status === 403) {
        setUnits({});
        setUnitsStatus(OrgUnitsStatus.DISABLED);
      } else {
        setUnitsStatus(OrgUnitsStatus.ERROR);
      }
    } catch {
      setUnitsStatus(OrgUnitsStatus.ERROR);
    }
  }, []);

  const ensureUnits = useCallback(() => {
    if (!hasRequestedUnits.current) {
      void refreshUnits();
    }
  }, [refreshUnits]);

  const getOwningUnit = useCallback((path: string) => findOwningUnit(units, path), [units]);

  const value = useMemo(
    () => ({ units, unitsStatus, groupClaim, ensureUnits, refreshUnits, getOwningUnit }),
    [units, unitsStatus, groupClaim, ensureUnits, refreshUnits, getOwningUnit],
  );

  return <OrgUnitsContext.Provider value={value}>{children}</OrgUnitsContext.Provider>;
};

export const useOrgUnits = (): OrgUnitsContextType => {
  const context = useContext(OrgUnitsContext);
  if (!context) {
    throw new Error('useOrgUnits must be used within an OrgUnitsProvider');
  }
  return context;
};
