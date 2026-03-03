import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions } from 'ag-grid-community';
import { FC, useEffect, useState } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { refreshOptionsConfig } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { getGridData } from '@/src/utils/telemetry';
import GridView from '@/src/components/Grid/GridView/GridView';

const additionalGridOptions: GridOptions = {
  defaultColDef: {
    filter: false,
  },
};
interface Props {
  columnDefs: ColDef[];
  title: string;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  query: TelemetryQuery;
  refreshTime?: string;
}

const TelemetryGrid: FC<Props> = ({ columnDefs, title, getData, query, refreshTime }) => {
  const t = useI18n();
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      const response = await getData(query);
      if (response?.success) {
        setData(getGridData(response.response as TelemetryData));
      } else {
        setData(null);
      }
      setLoading(false);
    };

    fetch();

    const timeout = refreshOptionsConfig.find((item) => item?.value === refreshTime)?.timeout;
    if (!timeout) {
      return;
    }

    const intervalId = setInterval(() => {
      fetch();
    }, timeout);

    return () => {
      clearInterval(intervalId);
    };
  }, [query, getData, refreshTime]);

  return (
    <div className="flex flex-col size-full rounded-lg border border-primary p-4 max-h-[580px]">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h3>{title}</h3>
      </div>
      {loading ? (
        <DialLoader size={24} />
      ) : (
        <div className="flex-1 min-h-0">
          <GridView
            emptyDataProps={{ title: t(BasicI18nKey.NoData) }}
            rowData={data}
            columnDefs={columnDefs}
            additionalGridOptions={additionalGridOptions}
          />
        </div>
      )}
    </div>
  );
};

export default TelemetryGrid;
