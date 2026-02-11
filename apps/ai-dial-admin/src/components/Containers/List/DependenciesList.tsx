import { FC, useCallback, useEffect, useState } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

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
      onOpenInNewTab(route, container);
    },
    [route],
  );

  const columnDefs = [
    ...IMAGE_DEPENDENCIES_COLUMNS(t),
    ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction)]),
  ];

  return (
    <GridView
      emptyDataProps={{ title: t(EntitiesI18nKey.NoContainers) }}
      rowData={containers}
      columnDefs={columnDefs}
    />
  );
};

export default DependenciesList;
