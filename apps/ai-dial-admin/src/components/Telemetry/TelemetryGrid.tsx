import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions } from 'ag-grid-community';
import { FC, useEffect, useRef, useState } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { refreshOptionsConfig } from '@/src/constants/telemetry/filters';
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
  getData?: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  query?: TelemetryQuery | null;
  refreshTime?: string;
  data?: Record<string, string>[] | null;
  loading?: boolean;
}

const TelemetryGrid: FC<Props> = ({
  columnDefs,
  title,
  getData,
  query,
  refreshTime,
  data: dataProp,
  loading: loadingProp,
}) => {
  const t = useI18n();
  const controlled = dataProp !== undefined;
  const [internalData, setInternalData] = useState<Record<string, string>[] | null>(null);
  const [internalLoading, setInternalLoading] = useState<boolean>(!controlled && !!query);

  // Keep getData in a ref so the fetch effect doesn't re-run (and re-fetch)
  // every time an ancestor passes a fresh function reference.
  const getDataRef = useRef(getData);
  useEffect(() => {
    getDataRef.current = getData;
  });

  useEffect(() => {
    if (controlled) return;
    if (!query) {
      setInternalData(null);
      setInternalLoading(false);
      return;
    }

    const fetch = async () => {
      const fn = getDataRef.current;
      if (!fn) {
        setInternalLoading(false);
        return;
      }
      try {
        const response = await fn(query);
        if (response?.success) {
          setInternalData(getGridData(response.response as TelemetryData));
        } else {
          setInternalData(null);
        }
      } catch {
        setInternalData(null);
      } finally {
        setInternalLoading(false);
      }
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
  }, [controlled, query, refreshTime]);

  const data = controlled ? (dataProp ?? null) : internalData;
  const loading = controlled ? !!loadingProp : internalLoading;

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
