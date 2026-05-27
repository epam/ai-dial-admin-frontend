import LineChart from '@/src/components/Telemetry/Dashboards/LineChart/LineChart';
import ConsumptionDashboard from '@/src/components/Telemetry/Dashboards/ConsumptionDashboard';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { createSystemUsageQuery } from '@/src/constants/telemetry';
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
      <ConsumptionDashboard route={route} getData={getData} refreshTime={effectiveRefreshTime} />
    </div>
  );
};

export default SimpleDashboard;
