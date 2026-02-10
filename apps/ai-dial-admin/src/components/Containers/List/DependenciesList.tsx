import { FC, useCallback, useEffect, useState } from 'react';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
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
      onOpenInNewTab(route, container);
    },
    [route],
  );

  const columnDefs = [
    ...IMAGE_DEPENDENCIES_COLUMNS(t),
    ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction)]),
  ];

  return <AgGridWrapper rowData={containers} columnDefs={columnDefs} />;
};

export default DependenciesList;
