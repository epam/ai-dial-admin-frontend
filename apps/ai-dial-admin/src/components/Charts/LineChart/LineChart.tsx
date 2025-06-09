'use client';
import { FC, useEffect, useState } from 'react';
import ReactECharts, { EChartsOption } from 'echarts-for-react';
import { BasicI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { refreshOptionsConfig, SYSTEM_USAGE_QUERY } from '@/src/constants/telemetry';
import Loader from '@/src/components/Common/Loader/Loader';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import { getLineChartData, prepareChartData } from '@/src/utils/telemetry';

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
        const data = getLineChartData(response.response as TelemetryData);
        setData(data);
        setOptions(prepareChartData(data));
      } else {
        setData(null);
      }
      setLoading(false);
    };

    fetchData();

    const timeout = refreshOptionsConfig.find((item) => item?.id === refreshTime)?.timeout;
    if (!timeout) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchData();
    }, timeout);

    return () => {
      clearInterval(intervalId);
    };
  }, [getData, refreshTime]);

  return (
    <div className="flex flex-col w-full min-w-0 rounded-lg border border-primary p-4 md:mr-8 md:mb-0 mr-0 mb-8 min-h-[280px]">
      <h3 className="text-primary mb-4">{t(TelemetryI18nKey.SystemUsage)}</h3>

      {loading ? (
        <Loader dataTestId={'chart-loader'} size={24} />
      ) : (
        <>
          {!data?.length ? (
            <NoDataContent dataTestId={'chart-no-data'} emptyDataTitle={t(BasicI18nKey.NoData)} />
          ) : (
            <div data-testid={'chart'}>
              {options && <ReactECharts option={options} className="flex w-full h-full min-h-[280px] m-0 p-0" />}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LineChart;
