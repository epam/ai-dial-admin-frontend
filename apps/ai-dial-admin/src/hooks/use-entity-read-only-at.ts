import { useEffect } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteNamespace } from '@/src/utils/org-units/namespaces';

/**
 * Makes `isReadOnlyAdmin` true for as long as a detail view is mounted, which every edit control already
 * follows. `isReadOnly` carries the view's own reason (a config-file source); in unit mode the unit owning
 * `path` must also grant `write` on the view's namespace.
 */
export const useEntityReadOnlyAt = (view: ApplicationRoute, path: string | undefined, isReadOnly = false): void => {
  const { isUnitMode, canWriteAt, setEntityReadOnly } = useAppContext();
  const namespace = getRouteNamespace(view);
  const isDeniedByUnit = isUnitMode && (namespace == null || !canWriteAt(namespace, path ?? ''));
  const isEntityReadOnly = isReadOnly || isDeniedByUnit;

  useEffect(() => {
    setEntityReadOnly(isEntityReadOnly);
    return () => setEntityReadOnly(false);
  }, [isEntityReadOnly, setEntityReadOnly]);
};
