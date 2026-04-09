'use client';
import { FC, useEffect, useState } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import ReactECharts, { EChartsOption } from 'echarts-for-react';

import { BasicI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { createMcpUsageQuery, refreshOptionsConfig } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData } from '@/src/models/telemetry';
import { getListingData, prepareMultiSeriesChartData } from '@/src/utils/telemetry';
import { QueryInput } from '@/src/components/Telemetry/Dashboard';

interface Props {
  getData: (input: QueryInput) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const McpUsageChart: FC<Props> = ({ getData, refreshTime }) => {
  const t = useI18n();
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<EChartsOption | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await getData(createMcpUsageQuery);

      if (response.success) {
        const data = getListingData(response.response as TelemetryData);
        setData(data);
        setOptions(prepareMultiSeriesChartData(data, t));
      } else {
        setData(null);
      }
      setLoading(false);
    };

    fetchData();

    const timeout = refreshOptionsConfig.find((item) => item?.value === refreshTime)?.timeout;
    if (!timeout) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchData();
    }, timeout);

    return () => {
      clearInterval(intervalId);
    };
  }, [getData, t, refreshTime]);

  return (
    <div className="flex flex-col flex-1 rounded-lg border border-primary p-4 min-h-[280px] min-w-[200px]">
      <h3 className="text-primary mb-4">{t(TelemetryI18nKey.RequestPerMcpUsage)}</h3>

      {loading ? (
        <DialLoader size={24} />
      ) : (
        <>
          {!data?.length ? (
            <DialNoDataContent title={t(BasicI18nKey.NoData)} />
          ) : (
            <div>{options && <ReactECharts option={options} className="flex size-full min-h-[280px] m-0 p-0" />}</div>
          )}
        </>
      )}
    </div>
  );
};

export default McpUsageChart;
