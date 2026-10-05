'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import { useAssetRunnerDetails } from '@/src/components/Assets/Platform/use-asset-runner-details';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import ObjectAppRoutes from './ObjectAppRoutes';
import { ObjectAppRouteFormat, ObjectAppRoutes as ObjectAppRoutesModel } from './models';

interface Props {
  roles?: DialRole[] | null;
  applicationRunners: DialApplicationScheme[];
  selectedEntity: DialApplicationResource;
  onChangeEntity: (entity: DialApplication) => void;
}

const AssetApplicationAppRoutes: FC<Props> = ({ selectedEntity, applicationRunners, onChangeEntity, roles }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const hasSchemaSource = !!selectedEntity.application_type_schema_id;

  const appRunner = useMemo(
    () =>
      hasSchemaSource
        ? getAppRunner(selectedEntity, applicationRunners, ApplicationRoute.AssetsApplications)
        : undefined,
    [applicationRunners, hasSchemaSource, selectedEntity],
  );
  const { routes: runnerRoutes, isLoading, error } = useAssetRunnerDetails(appRunner);

  const routes = hasSchemaSource ? runnerRoutes : (selectedEntity.routes as ObjectAppRoutesModel | undefined);
  const format = hasSchemaSource ? ObjectAppRouteFormat.AppRunner : ObjectAppRouteFormat.AssetApplication;

  const onChangeRoutes = useCallback(
    (updatedRoutes: ObjectAppRoutesModel) => {
      onChangeEntity({ ...selectedEntity, routes: updatedRoutes } as unknown as DialApplication);
    },
    [onChangeEntity, selectedEntity],
  );

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
    <ObjectAppRoutes
      roles={roles}
      routes={routes ?? undefined}
      format={format}
      disabled={hasSchemaSource || isReadOnlyAdmin}
      onChangeRoutes={onChangeRoutes}
    />
  );
};

export default AssetApplicationAppRoutes;
