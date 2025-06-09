import { FC } from 'react';
import SingleValueChart from '@/src/components/Charts/SingleValueChart/SingleValueChart';
import { TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { MONEY_QUERY, REQUEST_COUNT_QUERY, TOTAL_TOKENS_QUERY, UNIQ_USERS_QUERY } from '@/src/constants/telemetry';

interface Props {
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const SingleValueChartsDashboard: FC<Props> = ({ getData, refreshTime }) => {
  const config = [
    { title: TelemetryI18nKey.UniqueUsers, query: UNIQ_USERS_QUERY },
    { title: TelemetryI18nKey.RequestCount, query: REQUEST_COUNT_QUERY },
    { title: TelemetryI18nKey.TotalTokens, query: TOTAL_TOKENS_QUERY },
    { title: TelemetryI18nKey.Money, query: MONEY_QUERY, unit: '$' },
  ];
  return (
    <div className="flex flex-shrink-0">
      <div className="grid grid-cols-2 gap-6 w-full">
        {config.map(({ title, query, unit }, index) => (
          <SingleValueChart
            key={index}
            title={title}
            getData={getData}
            refreshTime={refreshTime}
            query={query}
            unit={unit || null}
          />
        ))}
      </div>
    </div>
  );
};

export default SingleValueChartsDashboard;
