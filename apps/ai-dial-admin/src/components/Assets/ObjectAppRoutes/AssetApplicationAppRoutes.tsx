'use client';

import { FC, useCallback } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { useAssetRunnerDetails } from '@/src/components/Assets/Platform/use-asset-runner-details';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import ObjectAppRoutes from './ObjectAppRoutes';
import { ObjectAppRouteFormat, ObjectAppRoutes as ObjectAppRoutesModel } from './models';

interface Props {
  roles?: DialRole[] | null;
  selectedEntity: DialApplicationResource;
  onChangeEntity: (entity: DialApplication) => void;
}

const AssetApplicationAppRoutes: FC<Props> = ({ selectedEntity, onChangeEntity, roles }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const hasSchemaSource = !!selectedEntity.application_type_schema_id;
  const {
    routes: runnerRoutes,
    isLoading,
    error,
  } = useAssetRunnerDetails(undefined, selectedEntity.application_type_schema_id);

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
