import LineChart from '@/src/components/Telemetry/Dashboards/LineChart/LineChart';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import { PROJECT_GRID_COLUMNS, TELEMETRY_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { createSystemUsageQuery, ENTITY_CONSUMPTION_QUERY, PROJECT_CONSUMPTION_QUERY } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { TelemetryQuery } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';
import { FC } from 'react';
import ChartsDashboard from './ChartsDashboard';

export type QueryInput = TelemetryQuery | ((resolution: ChartResolution) => TelemetryQuery);

interface Props {
  route: ApplicationRoute;
  effectiveRefreshTime?: string;

  getData: (input: QueryInput) => Promise<any>;
}

const SimpleDashboard: FC<Props> = ({ route, effectiveRefreshTime, getData }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-auto">
      <div className="flex flex-col md:flex-row mb-6 md:flex-wrap gap-6">
        <LineChart
          title={t(TelemetryI18nKey.SystemUsage)}
          query={createSystemUsageQuery}
          getData={getData}
          refreshTime={effectiveRefreshTime}
        />
        <ChartsDashboard getData={getData} refreshTime={effectiveRefreshTime} />
      </div>
      <div className="flex flex-col w-full">
        {route === ApplicationRoute.Dashboard && (
          <div className="flex mb-6 w-full relative">
            <TelemetryGrid
              getData={getData}
              refreshTime={effectiveRefreshTime}
              query={ENTITY_CONSUMPTION_QUERY}
              columnDefs={TELEMETRY_GRID_COLUMNS}
              title={t(TelemetryI18nKey.EntitiesConsumption)}
            />
          </div>
        )}
        <div className="flex size-full relative">
          <TelemetryGrid
            getData={getData}
            refreshTime={effectiveRefreshTime}
            query={PROJECT_CONSUMPTION_QUERY}
            columnDefs={PROJECT_GRID_COLUMNS}
            title={t(TelemetryI18nKey.ProjectsConsumption)}
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
