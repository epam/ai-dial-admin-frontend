import { FC, useCallback, useMemo } from 'react';

import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ApplicationSourceType, DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import EntityRoutes from './AppRoute';

interface Props {
  roles?: DialRole[] | null;
  applicationRunners: DialApplicationScheme[];
  selectedEntity: DialApplication;
  onChangeEntity: (entity: DialApplication) => void;
}

const ApplicationAppRoutes: FC<Props> = ({ selectedEntity, applicationRunners, onChangeEntity, ...props }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const hasSchemaSource =
    selectedEntity.source?.$type === ApplicationSourceType.SCHEMA ||
    !!(selectedEntity as DialApplicationResource).application_type_schema_id;

  const appRunner = useMemo(
    () => (hasSchemaSource ? getAppRunner(selectedEntity, applicationRunners) : undefined),
    [applicationRunners, hasSchemaSource, selectedEntity],
  );

  const routes = useMemo(
    () =>
      (hasSchemaSource ? appRunner?.['dial:applicationTypeRoutes'] : selectedEntity.routes) as
        | DialAppRoute[]
        | undefined,
    [appRunner, hasSchemaSource, selectedEntity.routes],
  );

  const onChangeRoutes = useCallback(
    (updatedRoutes: DialAppRoute[]) => onChangeEntity({ ...selectedEntity, routes: updatedRoutes }),
    [onChangeEntity, selectedEntity],
  );

  return (
    <EntityRoutes
      routes={routes}
      parentRoleLimits={selectedEntity.roleLimits}
      isPublicApp={selectedEntity.isPublic}
      disabled={hasSchemaSource || isReadOnlyAdmin}
      onChangeRoutes={onChangeRoutes}
      {...props}
    />
  );
};

export default ApplicationAppRoutes;
