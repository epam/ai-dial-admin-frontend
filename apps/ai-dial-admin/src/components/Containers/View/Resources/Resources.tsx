import { FC, useEffect, useState } from 'react';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { Resource } from '@/src/models/deployments/containers';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import { useI18n } from '@/src/locales/client';
import { getContainerResources } from '@/src/app/actions/deployments';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { EntitiesI18nKey } from '@/src/constants/i18n';

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

  if (!loading && !resources?.length) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoResources)} />;
  }
  return resources && <AgGridWrapper columnDefs={RESOURCES_COLUMNS} rowData={resources} />;
};

export default Resources;
