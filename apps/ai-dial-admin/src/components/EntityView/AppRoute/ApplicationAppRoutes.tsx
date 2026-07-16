import { FC, useCallback, useMemo } from 'react';

import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ApplicationSourceType, DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import EntityRoutes from './AppRoute';
import { DialApplicationResource } from '@/src/models/dial/resource';

interface Props {
  view: ApplicationRoute;
  roles?: DialRole[] | null;
  applicationRunners: DialApplicationScheme[];
  selectedEntity: DialApplication;
  onChangeEntity: (entity: DialApplication) => void;
}

const ApplicationAppRoutes: FC<Props> = ({ view, selectedEntity, applicationRunners, onChangeEntity, ...props }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const isAsset = view === ApplicationRoute.AssetsApplications;
  const hasSchemaSource =
    selectedEntity.source?.$type === ApplicationSourceType.SCHEMA ||
    !!(selectedEntity as DialApplicationResource).application_type_schema_id;

  const routes = useMemo(() => {
    if (!hasSchemaSource) {
      if (isAsset) {
        const record = (selectedEntity.routes || {}) as unknown as Record<string, DialAppRoute>;
        return Object.values(record);
      }
      return selectedEntity.routes || [];
    }
    const appRunners = getAppRunner(selectedEntity, applicationRunners, view);
    return appRunners?.['dial:applicationTypeRoutes'] || [];
  }, [hasSchemaSource, selectedEntity, applicationRunners, view, isAsset]);

  const onChangeRoutes = useCallback(
    (updatedRoutes: DialAppRoute[]) => {
      if (isAsset) {
        // Assets store routes as a Record keyed by the route name — rebuilding from the array
        // keeps the key in sync whenever a route's name changes.
        const record = updatedRoutes.reduce<Record<string, DialAppRoute>>((acc, route) => {
          acc[route.name || ''] = route;
          return acc;
        }, {});
        onChangeEntity({ ...selectedEntity, routes: record } as unknown as DialApplication);
        return;
      }
      onChangeEntity({ ...selectedEntity, routes: updatedRoutes } as DialApplication);
    },
    [isAsset, onChangeEntity, selectedEntity],
  );

  return (
    <EntityRoutes
      isAssetView={isAsset}
      parentRoleLimits={(selectedEntity as DialApplication).roleLimits}
      routes={routes}
      isPublicApp={selectedEntity.isPublic}
      disabled={hasSchemaSource || isReadOnlyAdmin}
      onChangeRoutes={onChangeRoutes}
      {...props}
    />
  );
};

export default ApplicationAppRoutes;
