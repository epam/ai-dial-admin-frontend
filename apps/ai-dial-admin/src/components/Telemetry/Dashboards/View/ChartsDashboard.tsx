import { FC } from 'react';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import {
  ENTITY_CONSUMPTION_TREE_QUERY,
  MONEY_QUERY,
  REQUEST_COUNT_QUERY,
  UNIQ_USERS_QUERY,
} from '@/src/constants/telemetry';
import SingleValueChart from '@/src/components/Telemetry/Dashboards/Values/SingleValueChart';
import { getTotalTokensFromTree } from '@/src/utils/telemetry';

interface Props {
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

interface ChartConfig {
  title: string;
  query: TelemetryQuery;
  unit?: string;
  getValue?: (data: TelemetryData) => number;
}

const ChartsDashboard: FC<Props> = ({ getData, refreshTime }) => {
  const config: ChartConfig[] = [
    { title: TelemetryI18nKey.UniqueUsers, query: UNIQ_USERS_QUERY },
    { title: TelemetryI18nKey.RequestCount, query: REQUEST_COUNT_QUERY },
    {
      title: TelemetryI18nKey.TotalTokens,
      query: ENTITY_CONSUMPTION_TREE_QUERY,
      getValue: getTotalTokensFromTree,
    },
    { title: TelemetryI18nKey.Money, query: MONEY_QUERY, unit: '$' },
  ];
  return (
    <div className="flex shrink-0 overflow-auto">
      <div className="grid grid-cols-2 gap-6 w-full">
        {config.map(({ title, query, unit, getValue }, index) => (
          <SingleValueChart
            key={index}
            title={title}
            getData={getData}
            refreshTime={refreshTime}
            query={query}
            unit={unit || void 0}
            getValue={getValue}
          />
        ))}
      </div>
    </div>
  );
};

export default ChartsDashboard;
