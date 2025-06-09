import React, { FC, useCallback, useState } from 'react';
import LineChart from '@/src/components/Charts/LineChart/LineChart';
import SingleValueChartsDashboard from '@/src/components/Charts/SingleValueChart/SingleValueChartsDashboard';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import {
  DEFAULT_REFRESH_TIME,
  ENTITY_CONSUMPTION_QUERY,
  PROJECT_CONSUMPTION_QUERY,
  PROJECT_GRID_COLUMNS,
  TELEMETRY_GRID_COLUMNS,
} from '@/src/constants/telemetry';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { TimeRange } from '@/src/models/time-range';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import { useI18n } from '@/src/locales/client';
import TelemetryControls from '@/src/components/Telemetry/TelemetryControls/TelemetryControls';
import { ApplicationRoute } from '@/src/types/routes';
import { DialBaseEntity } from '@/src/models/dial/base-entity';

interface Props {
  route: ApplicationRoute;
  entity?: DialBaseEntity;
}

const Dashboard: FC<Props> = ({ route, entity }) => {
  const t = useI18n();
  const [filters, setFilters] = useState<FilterData[]>([]);
  const [refreshTime, setRefreshTime] = useState(DEFAULT_REFRESH_TIME);
  const [timePeriod, setTimePeriod] = useState(DEFAULT_TIME_PERIOD);
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const getData = useCallback(
    (query: TelemetryQuery) => {
      if (typeof query.query.from === 'string') {
        query.query.where = getFormattedFilters(timeRange, filters, entity?.name || null);
      } else {
        query.query.from.where = getFormattedFilters(timeRange, filters, entity?.name || null);
      }

      return getDashboardData(query);
    },
    [entity?.name, filters, timeRange],
  );

  const onRefreshTimeChange = useCallback(
    (time: string) => {
      setRefreshTime(time);
    },
    [setRefreshTime],
  );

  const onTimePeriodChange = useCallback((period: string) => {
    setTimePeriod(period);
    setTimeRange(getTimeRangeById(period));
  }, []);

  const onTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  return (
    <div data-testid="dashboards" className="flex flex-1 flex-col min-h-0 overflow-auto">
      <div className="flex w-full mb-6">
        <TelemetryControls
          selectedRefreshValue={refreshTime}
          onRefreshTimeChange={onRefreshTimeChange}
          timePeriod={timePeriod}
          onTimePeriodChange={onTimePeriodChange}
          onTimeRangeChange={onTimeRangeChange}
          filters={filters}
          timeRange={timeRange}
          setFilters={setFilters}
          getData={getData}
          route={route}
        />
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col md:flex-row mb-6">
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
