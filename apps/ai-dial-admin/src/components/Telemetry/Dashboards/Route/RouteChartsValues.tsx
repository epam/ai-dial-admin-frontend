import { FC } from 'react';

import { TelemetryI18nKey } from '@/src/constants/i18n';
import { ROUTE_TOTAL_CALLS_QUERY, ROUTE_UNIQUE_USERS_QUERY } from '@/src/constants/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import SingleValueChart from '../Values/SingleValueChart';

interface Props {
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const RouteChartsValues: FC<Props> = ({ getData, refreshTime }) => {
  return (
    <div className="flex flex-col shrink-0 overflow-auto gap-6">
      <SingleValueChart
        title={TelemetryI18nKey.UniqueUsers}
        getData={getData}
        refreshTime={refreshTime}
        query={ROUTE_UNIQUE_USERS_QUERY}
      />
      <SingleValueChart
        title={TelemetryI18nKey.TotalRouteCalls}
        getData={getData}
        refreshTime={refreshTime}
        query={ROUTE_TOTAL_CALLS_QUERY}
      />
    </div>
  );
};

export default RouteChartsValues;
