import { FC, useMemo } from 'react';

import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialRole } from '@/src/models/dial/role';
import EntityRoutes from './AppRoute';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';

interface Props {
  roles?: DialRole[] | null;
  applicationRunners: DialApplicationScheme[];
  selectedEntity: DialApplication;
  onChangeEntity: (entity: DialApplication) => void;
}

const ApplicationAppRoutes: FC<Props> = ({ selectedEntity, applicationRunners, onChangeEntity, ...props }) => {
  const routes = useMemo(() => {
    const appRunners = getAppRunner(selectedEntity, applicationRunners);
    return appRunners?.['dial:applicationTypeRoutes'] || selectedEntity.routes || [];
  }, [applicationRunners, selectedEntity]);

  return (
    <EntityRoutes
      parentRoleLimits={(selectedEntity as DialApplication).roleLimits}
      routes={routes}
      readonly={!!selectedEntity.customAppSchemaId}
      onChangeRoutes={(routes) => onChangeEntity({ ...selectedEntity, routes } as DialApplication)}
      {...props}
    />
  );
};

export default ApplicationAppRoutes;
