import { FC, useCallback, useMemo } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ApplicationSourceType, DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import EntityRoutes from './AppRoute';
import { useAssetRunnerRoutes } from './use-asset-runner-routes';
import { DialApplicationResource } from '@/src/models/dial/resource';

interface Props {
  view: ApplicationRoute;
  roles?: DialRole[] | null;
  applicationRunners: DialApplicationScheme[];
  selectedEntity: DialApplication;
  onChangeEntity: (entity: DialApplication) => void;
}

const ApplicationAppRoutes: FC<Props> = ({ view, selectedEntity, applicationRunners, onChangeEntity, ...props }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const isAsset = view === ApplicationRoute.AssetsApplications;
  const hasSchemaSource =
    selectedEntity.source?.$type === ApplicationSourceType.SCHEMA ||
    !!(selectedEntity as DialApplicationResource).application_type_schema_id;

  const appRunner = useMemo(
    () => (hasSchemaSource ? getAppRunner(selectedEntity, applicationRunners, view) : undefined),
    [hasSchemaSource, selectedEntity, applicationRunners, view],
  );

  const { routes: assetRunnerRoutes, isLoading, error } = useAssetRunnerRoutes(appRunner);

  const routes = useMemo(() => {
    if (!hasSchemaSource) {
      if (isAsset) {
        const record = (selectedEntity.routes || {}) as unknown as Record<string, DialAppRoute>;
        return Object.values(record);
      }
      return selectedEntity.routes || [];
    }
    return assetRunnerRoutes ?? appRunner?.['dial:applicationTypeRoutes'] ?? [];
  }, [hasSchemaSource, isAsset, selectedEntity, assetRunnerRoutes, appRunner]);

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

  // Mounting the route editor before the runner read settles would show its "No App Routes" empty
  // state, which is the very thing the read is there to answer.
  if (isLoading) {
    return (
      <div className="flex flex-col size-full">
        <DialLoader size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col size-full">
        <DialNoDataContent title={t(EntitiesI18nKey.ResolvedSchemaFailed)} description={error} />
      </div>
    );
  }

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
