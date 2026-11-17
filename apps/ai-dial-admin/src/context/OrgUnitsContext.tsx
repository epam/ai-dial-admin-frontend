'use client';
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { getOrgUnits } from '@/src/app/[lang]/folders-storage/actions';
import { OrgUnit, OrgUnitsStatus } from '@/src/models/dial/org-unit';
import { getOwningUnit as findOwningUnit, toUnitMap } from '@/src/utils/org-units/units';

export type OrgUnitMap = Record<string, OrgUnit>;

export interface OrgUnitsContextType {
  /** Units keyed by normalised `folder`. */
  units: OrgUnitMap;
  unitsStatus: OrgUnitsStatus;
  /** Loads the units on first call only; later calls are no-ops until `refreshUnits`. */
  ensureUnits: () => void;
  /**
   * Reads the units again and resolves with the map it settled on: empty when org units are off, the last
   * good map when the read fails. Never rejects. Once org units answered as off, it makes no request.
   */
  refreshUnits: () => Promise<OrgUnitMap>;
  /** The in-flight read if there is one, the first read if none was made, else the current map. Never rejects. */
  loadUnits: () => Promise<OrgUnitMap>;
  getOwningUnit: (path: string) => OrgUnit | undefined;
}

const OrgUnitsContext = createContext<OrgUnitsContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const OrgUnitsProvider = ({ children }: Props) => {
  const [units, setUnits] = useState<OrgUnitMap>({});
  const [unitsStatus, setUnitsStatus] = useState(OrgUnitsStatus.IDLE);
  // Callbacks outlive the render that created them, so they read the committed values from here.
  const unitsRef = useRef<OrgUnitMap>({});
  const statusRef = useRef(OrgUnitsStatus.IDLE);
  const hasRequestedUnits = useRef(false);
  const latestRequestId = useRef(0);
  const inFlightRequest = useRef<Promise<OrgUnitMap> | null>(null);

  const commit = useCallback((status: OrgUnitsStatus, next?: OrgUnitMap) => {
    statusRef.current = status;
    setUnitsStatus(status);
    if (next) {
      unitsRef.current = next;
      setUnits(next);
    }
  }, []);

  const refreshUnits = useCallback((): Promise<OrgUnitMap> => {
    hasRequestedUnits.current = true;
    if (statusRef.current === OrgUnitsStatus.DISABLED) {
      return Promise.resolve(unitsRef.current);
    }

    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    statusRef.current = OrgUnitsStatus.LOADING;
    setUnitsStatus(OrgUnitsStatus.LOADING);

    const request = (async (): Promise<OrgUnitMap> => {
      let status = OrgUnitsStatus.ERROR;
      let next: OrgUnitMap | undefined;
      try {
        const res = await getOrgUnits();
        if (res.success) {
          next = toUnitMap(res.response?.items ?? []);
          status = OrgUnitsStatus.READY;
        } else if (res.status === 404 || res.status === 403) {
          next = {};
          status = OrgUnitsStatus.DISABLED;
        }
      } catch {
        // A thrown read is a failed read: the last good map stays in use.
      }

      if (requestId !== latestRequestId.current) {
        return unitsRef.current;
      }
      inFlightRequest.current = null;
      commit(status, next);
      return unitsRef.current;
    })();
    inFlightRequest.current = request;
    return request;
  }, [commit]);

  const loadUnits = useCallback((): Promise<OrgUnitMap> => {
    if (inFlightRequest.current) {
      return inFlightRequest.current;
    }
    return hasRequestedUnits.current ? Promise.resolve(unitsRef.current) : refreshUnits();
  }, [refreshUnits]);

  const ensureUnits = useCallback(() => {
    if (!hasRequestedUnits.current) {
      void refreshUnits();
    }
  }, [refreshUnits]);

  const getOwningUnit = useCallback((path: string) => findOwningUnit(units, path), [units]);

  const value = useMemo(
    () => ({ units, unitsStatus, ensureUnits, refreshUnits, loadUnits, getOwningUnit }),
    [units, unitsStatus, ensureUnits, refreshUnits, loadUnits, getOwningUnit],
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
