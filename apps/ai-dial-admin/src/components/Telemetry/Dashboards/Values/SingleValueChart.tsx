import { FC, useEffect, useState } from 'react';

import SingleValueContent from '@/src/components/Common/SingleValue/SingleValueContent';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { getSingleValueChartData } from '@/src/utils/telemetry';
import { refreshOptionsConfig } from '@/src/constants/telemetry/filters';

interface Props {
  title: string;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  query: TelemetryQuery;
  unit?: string;
  refreshTime?: string;
  getValue?: (data: TelemetryData) => number;
}

const SingleValueChart: FC<Props> = ({
  title,
  getData,
  unit,
  query,
  refreshTime,
  getValue = getSingleValueChartData,
}) => {
  const [data, setData] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      const response = await getData(query);
      if (response.success) {
        setData(getValue(response.response as TelemetryData));
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
  }, [query, getData, refreshTime, getValue]);

  return <SingleValueContent title={title} value={data} loading={loading} unit={unit} />;
};

export default SingleValueChart;
