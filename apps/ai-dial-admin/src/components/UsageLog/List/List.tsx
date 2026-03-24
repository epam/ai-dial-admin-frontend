import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { FC, useEffect, useState } from 'react';

import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { getListingData } from '@/src/utils/telemetry';

import ListEntities from '@/src/components/ListView/List';

interface Props {
  route: ApplicationRoute;
  query: TelemetryQuery;
  columnDefs: ColDef[];
  listLabel: string;
  emptyDataTitle: string;

  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
}

const List: FC<Props> = ({ route, getData, query, columnDefs, listLabel, emptyDataTitle }) => {
  const [data, setData] = useState<Record<string, string>[] | undefined>(void 0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await getData(query);
      if (response.success) {
        const data = getListingData(response.response as TelemetryData);
console.log('Fetched data:', data);
        setData(data);
      } else {
        setData([]);
      }
      setLoading(false);
    };

    fetchData().catch((error) => console.error(`Getting usage log view data error: ${error}`));
  }, [getData, query]);

  if (!data?.length && loading) {
    return <DialLoader size={40} />;
  }

  return (
    <ListEntities
      rowData={data}
      columnDefs={columnDefs}
      listLabel={listLabel}
      emptyDataProps={{ title: emptyDataTitle }}
      storageKey={`${route}/${listLabel}`}
      isEnableColumnPanel
      isMainListView
    />
  );
};

export default List;
