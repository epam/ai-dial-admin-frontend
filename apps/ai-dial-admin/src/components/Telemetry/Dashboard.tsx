import { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import LineChart from '@/src/components/Charts/LineChart/LineChart';
import SingleValueChartsDashboard from '@/src/components/Charts/SingleValueChart/SingleValueChartsDashboard';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import TelemetryControls from '@/src/components/Telemetry/TelemetryControls/TelemetryControls';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { PROJECT_GRID_COLUMNS, TELEMETRY_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { DEFAULT_REFRESH_TIME, ENTITY_CONSUMPTION_QUERY, PROJECT_CONSUMPTION_QUERY } from '@/src/constants/telemetry';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';

interface Props {
  route: ApplicationRoute;
  entity?: BaseEntity;
  timeRange?: TimeRange;
  timeFilter?: ReactNode;
}

const Dashboard: FC<Props> = ({ route, entity, timeRange, timeFilter }) => {
  const t = useI18n();
  const [filters, setFilters] = useState<FilterData[]>([]);
  const [refreshTime, setRefreshTime] = useState(DEFAULT_REFRESH_TIME);
  const getReqRef = useRef(useProtectedRequest());

  const [isCustomRange, setIsCustomRange] = useState(false);
  const [timePeriod, setTimePeriod] = useState<string>(DEFAULT_TIME_PERIOD);
  const [ownTimeRange, setOwnTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const onTimePeriodChange = useCallback((period: string) => {
    setTimePeriod(period);
    setOwnTimeRange(getTimeRangeById(period));
  }, []);

  const onTimeRangeChange = useCallback((range: TimeRange) => {
    setOwnTimeRange(range);
  }, []);

  const ownTimeFilter = useMemo(() => {
    return (
      <TimeFilter
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={ownTimeRange}
        onTimeRangeChange={onTimeRangeChange}
        isCustomRange={isCustomRange}
        setIsCustomRange={setIsCustomRange}
      />
    );
  }, [isCustomRange, onTimePeriodChange, onTimeRangeChange, ownTimeRange, timePeriod]);

  const getData = useCallback(
    (query: TelemetryQuery) => {
      if (typeof query.query.from === 'string') {
        query.query.where = getFormattedFilters(timeRange || ownTimeRange, filters, entity?.name || null);
      } else {
        query.query.from.where = getFormattedFilters(timeRange || ownTimeRange, filters, entity?.name || null);
      }

      return getReqRef.current(getDashboardData, query);
    },
    [entity?.name, filters, ownTimeRange, timeRange],
  );

  const onRefreshTimeChange = useCallback(
    (time: string) => {
      setRefreshTime(time);
    },
    [setRefreshTime],
  );

  return (
    <div role="dashboards" className="flex flex-1 flex-col min-h-0 min-w-0">
      <div className="flex w-full mb-4">
        {timeRange && (
          <TelemetryControls
            selectedRefreshValue={refreshTime}
            onRefreshTimeChange={onRefreshTimeChange}
            filters={filters}
            setFilters={setFilters}
            getData={getData}
            route={route}
            timeFilter={timeFilter}
          />
        )}
        {!timeRange && ownTimeRange && (
          <TelemetryControls
            selectedRefreshValue={refreshTime}
            onRefreshTimeChange={onRefreshTimeChange}
            filters={filters}
            setFilters={setFilters}
            getData={getData}
            route={route}
            timeFilter={ownTimeFilter}
          />
        )}
      </div>
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-auto">
        <div className="flex flex-col md:flex-row mb-6 md:flex-wrap gap-6">
          <LineChart getData={getData} refreshTime={refreshTime} />
          <SingleValueChartsDashboard getData={getData} refreshTime={refreshTime} />
        </div>
        <div className="flex flex-col w-full">
          {route === ApplicationRoute.Dashboard && (
            <div className="flex mb-6 w-full relative">
              <TelemetryGrid
                getData={getData}
                refreshTime={refreshTime}
                query={ENTITY_CONSUMPTION_QUERY}
                columnDefs={TELEMETRY_GRID_COLUMNS}
                title={t(TelemetryI18nKey.EntitiesConsumption)}
              />
            </div>
          )}
          <div className="flex w-full h-full relative">
            <TelemetryGrid
              getData={getData}
              refreshTime={refreshTime}
              query={PROJECT_CONSUMPTION_QUERY}
              columnDefs={PROJECT_GRID_COLUMNS}
              title={t(TelemetryI18nKey.ProjectsConsumption)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
