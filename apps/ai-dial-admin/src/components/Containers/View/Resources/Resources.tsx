import { getContainerResources } from '@/src/app/actions/deployments';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Resource } from '@/src/models/deployments/containers';
import { ColDef } from 'ag-grid-community';
import { FC, useEffect, useState } from 'react';

interface Props {
  containerId?: string;
}

const RESOURCES_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', floatingFilter: false, filter: false, sortable: false },
  { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
  { field: 'uri', headerName: 'URI', floatingFilter: false, filter: false, sortable: false },
  {
    field: 'mimeType',
    headerName: 'MIME Type',
    floatingFilter: false,
    filter: false,
    sortable: false,
    cellRenderer: (data: { data?: Resource }) => (
      <TagsCellRenderer items={data.data?.mimeType ? [data.data?.mimeType] : []} />
    ),
  },
];

const Resources: FC<Props> = ({ containerId }) => {
  const t = useI18n();

  const [resources, setResources] = useState<Resource[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchResources = async () => {
      if (containerId) {
        setLoading(true);
        const data = await getContainerResources(containerId);
        if (data) {
          setResources(data.resources);
        }
        setLoading(false);
      }
    };

    fetchResources().catch((error) => console.error(`Getting container resources error: ${error}`));
  }, [containerId]);

  return (
    <GridView
      getIsEmptyData={() => !loading && !resources?.length}
      emptyDataProps={{ title: t(EntitiesI18nKey.NoResources) }}
      columnDefs={RESOURCES_COLUMNS}
      rowData={resources}
    />
  );
};

export default Resources;
