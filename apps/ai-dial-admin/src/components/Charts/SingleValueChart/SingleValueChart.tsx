import { FC, useEffect, useState } from 'react';
import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { formatNumberWithExponent } from '@/src/utils/formatting/number-formatting';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { BasicI18nKey } from '@/src/constants/i18n';
import { getSingleValueChartData } from '@/src/utils/telemetry';
import { refreshOptionsConfig } from '@/src/constants/telemetry';

interface Props {
  title: string;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  query: TelemetryQuery;
  unit: string | null;
  refreshTime?: string;
}

const SingleValueChart: FC<Props> = ({ title, getData, unit, query, refreshTime }) => {
  const t = useI18n();
  const [data, setData] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      const response = await getData(query);
      console.log('SingleValueChart response', response);
      if (response.success) {
        setData(getSingleValueChartData(response.response as TelemetryData));
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
    <div className="flex flex-col rounded-lg border border-primary md:min-w-[250px] min-w-[120px] w-full p-4 flex-1 min-h-0">
      <h3 className="text-primary mb-4">{t(title)}</h3>
      {loading ? (
        <DialLoader size={24} />
      ) : (
        <>
          {data === null ? (
            <DialNoDataContent title={t(BasicI18nKey.NoData)} />
          ) : (
            <div className="flex items-center justify-center text-accent-primary md:text-6xl font-semibold h-full text-3xl nowrap">
              {unit && <span className="text-secondary font-extralight mr-1">{unit}</span>}
              {formatNumberWithExponent(data)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SingleValueChart;
