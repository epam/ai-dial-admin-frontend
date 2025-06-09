import { FC, useEffect, useState } from 'react';
import { ColDef, GridOptions } from 'ag-grid-community';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Grid from '@/src/components/Grid/Grid';
import { refreshOptionsConfig } from '@/src/constants/telemetry';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import Loader from '@/src/components/Common/Loader/Loader';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { getGridData } from '@/src/utils/telemetry';

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
  const t = useI18n() as (stringToTranslate: string) => string;
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      const response = await getData(query);
      if (response.success) {
        setData(getGridData(response.response as TelemetryData));
      } else {
        setData(null);
      }
      setLoading(false);
    };

    fetch();

    const timeout = refreshOptionsConfig.find((item) => item?.id === refreshTime)?.timeout;
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
    <div className="flex flex-col w-full rounded-lg border border-primary p-4 h-full max-h-[580px]">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h3>{title}</h3>
      </div>
      {loading ? (
        <Loader size={24} />
      ) : (
        <>
          {!data?.length ? (
            <NoDataContent emptyDataTitle={t(BasicI18nKey.NoData)} />
          ) : (
            <Grid rowData={data} columnDefs={columnDefs} additionalGridOptions={additionalGridOptions} />
          )}
        </>
      )}
    </div>
  );
};

export default TelemetryGrid;
