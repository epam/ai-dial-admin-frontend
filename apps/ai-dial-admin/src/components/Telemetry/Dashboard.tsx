import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import McpDashboard from '@/src/components/Telemetry/Dashboards/Mcp/McpDashboard';
import TelemetryControls from '@/src/components/Telemetry/TelemetryControls/TelemetryControls';
import ViewByFilter from '@/src/components/Telemetry/TelemetryControls/ViewByFilter';
import {
  DEFAULT_REFRESH_TIME,
  MCP_TOOL_CALLS_EXTRA_CONDITIONS,
  MCP_TOOLS_CONSUMPTION_EXTRA_CONDITIONS,
  TOOLSET_DEPLOYMENT_PREFIX,
} from '@/src/constants/telemetry';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { TimeFilterValue } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { DASHBOARD_VIEW_TYPE } from '@/src/types/telemetry';
import { isToolsetRoute } from '@/src/utils/is-view';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { ChartResolution, getChartResolution } from '@/src/utils/time-filter/get-chart-resolution';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import RouteDashboard from './Dashboards/Route/RouteDashboard';
import SimpleDashboard from './Dashboards/View/SimpleDashboard';

export type QueryInput = TelemetryQuery | ((resolution: ChartResolution) => TelemetryQuery);

interface Props {
  route: ApplicationRoute;
  defaultTimeFilter?: TimeFilterValue;
  entity?: BaseEntity;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

const Dashboard: FC<Props> = ({ route, entity, defaultTimeFilter, onTimeFilterChange }) => {
  const [filters, setFilters] = useState<FilterData[]>([]);
  const [refreshTime, setRefreshTime] = useState(DEFAULT_REFRESH_TIME);
  const [viewType, setViewType] = useState<DASHBOARD_VIEW_TYPE>(DASHBOARD_VIEW_TYPE.Chat);
  const { timePeriod, timeRange, canAutoRefresh, getCurrentTimeRange, onTimePeriodChange, onTimeRangeChange } =
    useTimeFilter({
      defaultTimeFilter,
      onTimeFilterChange,
    });
  const effectiveRefreshTime = canAutoRefresh ? refreshTime : 'off';
  const getReqRef = useRef(useProtectedRequest());

  const isMcpOnly = isToolsetRoute(route);
  const isMcpDashboards = isMcpOnly || viewType === DASHBOARD_VIEW_TYPE.Mcp;
  const isRouteDashboards = viewType === DASHBOARD_VIEW_TYPE.Route;

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
        <TelemetryControls
          selectedRefreshValue={effectiveRefreshTime}
          onRefreshTimeChange={onRefreshTimeChange}
          timePeriod={timePeriod}
          onTimePeriodChange={onTimePeriodChange}
          onTimeRangeChange={onTimeRangeChange}
          filters={filters}
          timeRange={timeRange}
          setFilters={setFilters}
          getData={getData}
          route={route}
          canAutoRefresh={canAutoRefresh}
          isMcpView={isMcpDashboards}
        />
      </div>
      {isMcpDashboards ? (
        <McpDashboard
          getData={getData}
          getToolCallsData={getMcpToolCallsData}
          getToolsConsumptionData={getMcpToolsConsumptionData}
          refreshTime={effectiveRefreshTime}
          isEntityView={!!entity}
        />
      ) : isRouteDashboards ? (
        <RouteDashboard
          getData={getData}
          getToolsConsumptionData={getMcpToolsConsumptionData}
          refreshTime={effectiveRefreshTime}
          isEntityView={!!entity}
        />
      ) : (
        <SimpleDashboard
          route={route}
          effectiveRefreshTime={effectiveRefreshTime}
          entity={entity}
          filters={filters}
          defaultTimeFilter={defaultTimeFilter}
          onTimeFilterChange={onTimeFilterChange}
        />
      )}
    </div>
  );
};

export default Dashboard;
