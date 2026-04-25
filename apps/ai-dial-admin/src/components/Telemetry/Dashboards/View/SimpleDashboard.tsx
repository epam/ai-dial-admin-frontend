import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import LineChart from '@/src/components/Telemetry/Dashboards/LineChart/LineChart';
import ChartsDashboard from '@/src/components/Telemetry/Dashboards/SingleValueChart/ChartsDashboard';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import { PROJECT_GRID_COLUMNS, TELEMETRY_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import {
  createSystemUsageQuery,
  ENTITY_CONSUMPTION_QUERY,
  PROJECT_CONSUMPTION_QUERY,
  TOOLSET_DEPLOYMENT_PREFIX,
} from '@/src/constants/telemetry';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { TimeFilterValue } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { ChartResolution, getChartResolution } from '@/src/utils/time-filter/get-chart-resolution';
import { FC, useCallback, useMemo, useRef } from 'react';

export type QueryInput = TelemetryQuery | ((resolution: ChartResolution) => TelemetryQuery);

interface Props {
  route: ApplicationRoute;
  effectiveRefreshTime?: string;
  defaultTimeFilter?: TimeFilterValue;
  entity?: BaseEntity;
  filters: FilterData[];
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

const SimpleDashboard: FC<Props> = ({
  route,
  filters,
  effectiveRefreshTime,
  entity,
  defaultTimeFilter,
  onTimeFilterChange,
}) => {
  const t = useI18n();
  const { getCurrentTimeRange } = useTimeFilter({
    defaultTimeFilter,
    onTimeFilterChange,
  });
  const getReqRef = useRef(useProtectedRequest());

  const entityFilterName = useMemo(() => {
    if (route === ApplicationRoute.AssetsToolsets) {
      const path = (entity as unknown as { path?: string })?.path;
      return path ? `${TOOLSET_DEPLOYMENT_PREFIX}${path}` : entity?.name || null;
    }
    return entity?.name || null;
  }, [route, entity]);

  const getData = useCallback(
    (input: QueryInput) => {
      const currentTimeRange = getCurrentTimeRange();
      const resolution = getChartResolution(currentTimeRange);
      const q = typeof input === 'function' ? input(resolution) : structuredClone(input);
      if (typeof q.query.from === 'string') {
        q.query.where = getFormattedFilters(currentTimeRange, filters, entityFilterName);
      } else {
        q.query.from.where = getFormattedFilters(currentTimeRange, filters, entityFilterName);
      }

      return getReqRef.current(getDashboardData, q);
    },
    [entityFilterName, filters, getCurrentTimeRange],
  );

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
