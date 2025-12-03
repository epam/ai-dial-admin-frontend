import { FC, useCallback, useEffect, useState } from 'react';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { ACTION_COLUMN, ACTION_COLUMN_COMPONENTS } from '@/src/constants/ag-grid';
import Grid from '@/src/components/Grid/Grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  containerList: Container[];
  route: ApplicationRoute;
}

const DependenciesList: FC<Props> = ({ containerList, route }) => {
  const t = useI18n();
  const [containers, setContainers] = useState<Container[]>([]);

  useEffect(() => {
    setContainers(containerList);
  }, [containerList]);

  const onOpenInNewTabAction = useCallback(
    (container?: Container) => {
      onOpenInNewTab(route, container, DEPLOYMENT_ENTITY.containers);
    },
    [route],
  );

  const columnDefs = [
    ...IMAGE_DEPENDENCIES_COLUMNS(t),
    ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction)]),
  ];

  return (
    <Grid
      rowData={containers}
      columnDefs={columnDefs}
      additionalGridOptions={{
        ...ACTION_COLUMN_COMPONENTS,
      }}
    />
  );
};

export default DependenciesList;
