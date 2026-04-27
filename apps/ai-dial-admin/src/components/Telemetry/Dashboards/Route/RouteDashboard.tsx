import { FC } from 'react';

import { QueryInput } from '@/src/components/Telemetry/Dashboard';
import RouteChartsValues from '@/src/components/Telemetry/Dashboards/Route/RouteChartsValues';
import {
  CALL_BY_DEPLOYMENT_COLUMNS,
  CALL_BY_PARENT_DEPLOYMENT_COLUMNS,
  CALL_BY_PROJECT_COLUMNS,
  CALL_BY_ROUTES_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import {
  createRouteUsageQuery,
  ROUTE_DEPLOYMENT_QUERY,
  ROUTE_PARENT_DEPLOYMENT_QUERY,
  ROUTE_PROJECT_QUERY,
  ROUTE_QUERY,
} from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import LineChart from '@/src/components/Telemetry/Dashboards/LineChart/LineChart';

interface Props {
  getData: (input: QueryInput) => Promise<ServerActionResponse>;
  getToolsConsumptionData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime: string;
  isEntityView?: boolean;
}

const RouteDashboard: FC<Props> = ({ getData, getToolsConsumptionData, refreshTime, isEntityView = false }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-auto">
      <div className="flex flex-col md:flex-row mb-6 md:flex-wrap gap-6">
        <LineChart
          title={t(TelemetryI18nKey.RouteRequests)}
          query={createRouteUsageQuery}
          getData={getData}
          refreshTime={refreshTime}
        />
        <RouteChartsValues getData={getData} refreshTime={refreshTime} />
      </div>
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col md:flex-row gap-6">
          {!isEntityView && (
            <div className="flex flex-1 relative">
              <TelemetryGrid
                getData={getData}
                refreshTime={refreshTime}
                query={ROUTE_DEPLOYMENT_QUERY}
                columnDefs={CALL_BY_DEPLOYMENT_COLUMNS}
                title={t(TelemetryI18nKey.CallsByDeployment)}
              />
            </div>
          )}

          <div className="flex flex-1 relative">
            <TelemetryGrid
              getData={getToolsConsumptionData}
              refreshTime={refreshTime}
              query={ROUTE_QUERY}
              columnDefs={CALL_BY_ROUTES_COLUMNS}
              title={t(TelemetryI18nKey.CallsByRoute)}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-1 relative">
            <TelemetryGrid
              getData={getData}
              refreshTime={refreshTime}
              query={isEntityView ? null : ROUTE_PARENT_DEPLOYMENT_QUERY}
              columnDefs={CALL_BY_PARENT_DEPLOYMENT_COLUMNS}
              title={t(TelemetryI18nKey.CallsFromParentDeployments)}
            />
          </div>
          <div className="flex flex-1 relative">
            <TelemetryGrid
              getData={getData}
              refreshTime={refreshTime}
              query={ROUTE_PROJECT_QUERY}
              columnDefs={CALL_BY_PROJECT_COLUMNS}
              title={t(TelemetryI18nKey.CallsByProject)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDashboard;
