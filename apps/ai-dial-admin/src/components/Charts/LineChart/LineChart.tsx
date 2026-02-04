'use client';
import { FC, useEffect, useState } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import ReactECharts, { EChartsOption } from 'echarts-for-react';

import { BasicI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { refreshOptionsConfig, SYSTEM_USAGE_QUERY } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { getListingData, prepareChartData } from '@/src/utils/telemetry';

interface Props {
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const LineChart: FC<Props> = ({ getData, refreshTime }) => {
  const t = useI18n();
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<EChartsOption | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await getData(SYSTEM_USAGE_QUERY);

      if (response.success) {
        const data = getListingData(response.response as TelemetryData);
        setData(data);
        setOptions(prepareChartData(data, t));
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
      <h3 className="text-primary mb-4">{t(TelemetryI18nKey.SystemUsage)}</h3>

      {loading ? (
        <DialLoader size={24} />
      ) : (
        <>
          {!data?.length ? (
            <DialNoDataContent title={t(BasicI18nKey.NoData)} />
          ) : (
            <div>
              {options && <ReactECharts option={options} className="flex w-full h-full min-h-[280px] m-0 p-0" />}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LineChart;
