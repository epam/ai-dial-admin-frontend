import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LineChart from '@/src/components/Charts/LineChart/LineChart';
import SingleValueChartsDashboard from '@/src/components/Charts/SingleValueChart/SingleValueChartsDashboard';
import McpDashboard from '@/src/components/Telemetry/McpDashboard';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import {
  DEFAULT_REFRESH_TIME,
  ENTITY_CONSUMPTION_QUERY,
  MCP_TOOL_CALLS_EXTRA_CONDITIONS,
  MCP_TOOLS_CONSUMPTION_EXTRA_CONDITIONS,
  PROJECT_CONSUMPTION_QUERY,
  TOOLSET_DEPLOYMENT_PREFIX,
} from '@/src/constants/telemetry';
import { PROJECT_GRID_COLUMNS, TELEMETRY_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { TimeRange } from '@/src/models/time-range';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { ChartResolution, getChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

export type QueryInput = TelemetryQuery | ((resolution: ChartResolution) => TelemetryQuery);
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import { useI18n } from '@/src/locales/client';
import TelemetryControls from '@/src/components/Telemetry/TelemetryControls/TelemetryControls';
import ViewByFilter from '@/src/components/Telemetry/TelemetryControls/ViewByFilter';
import { ApplicationRoute } from '@/src/types/routes';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimePeriodOptions } from '@/src/hooks/use-time-period-options';
import { DASHBOARD_VIEW_TYPE } from '@/src/types/telemetry';
import { isToolsetRoute } from '@/src/utils/is-view';

interface Props {
  route: ApplicationRoute;
  initTimeFilter?: string | TimeRange;
  entity?: BaseEntity;
  onChangeTimeFilter?: (filter: string | TimeRange) => void;
  isCustomRange?: boolean;
  setIsCustomRange?: Dispatch<SetStateAction<boolean>>;
}

const Dashboard: FC<Props> = ({
  route,
  entity,
  initTimeFilter,
  onChangeTimeFilter,
  isCustomRange,
  setIsCustomRange,
}) => {
  const t = useI18n();
  const [filters, setFilters] = useState<FilterData[]>([]);
  const [refreshTime, setRefreshTime] = useState(DEFAULT_REFRESH_TIME);
  const [timePeriod, setTimePeriod] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));
  const [viewType, setViewType] = useState<DASHBOARD_VIEW_TYPE>(DASHBOARD_VIEW_TYPE.Chat);
  const timePeriodOptions = useTimePeriodOptions();
  const getReqRef = useRef(useProtectedRequest());

  const isMcpOnly = isToolsetRoute(route);
  const isMcpView = isMcpOnly || viewType === DASHBOARD_VIEW_TYPE.Mcp;
  const entityFilterName = useMemo(() => {
    if (route === ApplicationRoute.AssetsToolsets) {
      const path = (entity as unknown as { path?: string })?.path;
      return path ? `${TOOLSET_DEPLOYMENT_PREFIX}${path}` : entity?.name || null;
    }
    return entity?.name || null;
  }, [route, entity]);

  useEffect(() => {
    if (!timePeriod) {
      if (!isCustomRange) {
        setTimePeriod((initTimeFilter as string) || DEFAULT_TIME_PERIOD);
        setTimeRange(getTimeRangeById((initTimeFilter as string) || DEFAULT_TIME_PERIOD));
      } else {
        setTimePeriod(DEFAULT_TIME_PERIOD);
        setTimeRange((initTimeFilter as TimeRange) || getTimeRangeById(DEFAULT_TIME_PERIOD));
      }
    }
  }, [initTimeFilter, timePeriod, isCustomRange]);

  const getCurrentTimeRange = useCallback(
    () => (isCustomRange ? timeRange : getTimeRangeById(timePeriod || DEFAULT_TIME_PERIOD)),
    [isCustomRange, timeRange, timePeriod],
  );

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

  const getMcpDataWithConditions = useCallback(
    (extraConditions: Record<string, unknown>[]) => (input: QueryInput) => {
      const currentTimeRange = getCurrentTimeRange();
      const resolution = getChartResolution(currentTimeRange);
      const q = typeof input === 'function' ? input(resolution) : structuredClone(input);
      if (typeof q.query.from === 'string') {
        q.query.where = getFormattedFilters(currentTimeRange, filters, entityFilterName, extraConditions);
      } else {
        q.query.from.where = getFormattedFilters(currentTimeRange, filters, entityFilterName, extraConditions);
      }

      return getReqRef.current(getDashboardData, q);
    },
    [entityFilterName, filters, getCurrentTimeRange],
  );

  const getMcpToolCallsData = useMemo(
    () => getMcpDataWithConditions(MCP_TOOL_CALLS_EXTRA_CONDITIONS),
    [getMcpDataWithConditions],
  );

  const getMcpToolsConsumptionData = useMemo(
    () => getMcpDataWithConditions(MCP_TOOLS_CONSUMPTION_EXTRA_CONDITIONS),
    [getMcpDataWithConditions],
  );

  const onRefreshTimeChange = useCallback(
    (time: string) => {
      setRefreshTime(time);
    },
    [setRefreshTime],
  );

  const onTimePeriodChange = useCallback(
    (period: string) => {
      setTimePeriod(period);
      onChangeTimeFilter?.(period);
      setTimeRange(getTimeRangeById(period));
    },
    [onChangeTimeFilter],
  );

  const onTimeRangeChange = useCallback(
    (range: TimeRange, isCustom?: boolean) => {
      setTimeRange(range);
      if (isCustom) {
        onChangeTimeFilter?.(range);
      }
    },
    [onChangeTimeFilter],
  );

  const onViewTypeChange = useCallback((type: DASHBOARD_VIEW_TYPE) => {
    setViewType(type);
    setFilters([]);
  }, []);

  return (
    <div role="dashboards" className="flex flex-1 flex-col min-h-0 min-w-0">
      <div className="flex w-full mb-6 gap-x-3 items-center">
        {(route === ApplicationRoute.Dashboard || route === ApplicationRoute.Applications) && (
          <ViewByFilter value={viewType} onChange={onViewTypeChange} />
        )}
        {timePeriod && (
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
            isCustomRange={isCustomRange}
            setIsCustomRange={setIsCustomRange}
            isMcpView={isMcpView}
            timePeriodOptions={timePeriodOptions}
          />
        )}
      </div>
      {isMcpView ? (
        <McpDashboard
          getData={getData}
          getToolCallsData={getMcpToolCallsData}
          getToolsConsumptionData={getMcpToolsConsumptionData}
          refreshTime={refreshTime}
          isEntityView={!!entity}
        />
      ) : (
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
            <div className="flex size-full relative">
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
      )}
    </div>
  );
};

export default Dashboard;
