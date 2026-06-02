import { FC } from 'react';

import McpChartsValues from '@/src/components/Telemetry/Dashboards/Mcp/McpChartsValues';
import { QueryInput } from '@/src/components/Telemetry/Dashboard';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import {
  MCP_CALLS_BY_DEPLOYMENT_COLUMNS,
  MCP_CONSUMPTION_COLUMNS,
  MCP_PROJECTS_CONSUMPTION_COLUMNS,
  TOOLS_CONSUMPTION_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import {
  createMcpUsageQuery,
  MCP_CALLS_BY_DEPLOYMENT_QUERY,
  MCP_CONSUMPTION_QUERY,
  MCP_PROJECTS_CONSUMPTION_QUERY,
  MCP_TOOLS_CONSUMPTION_QUERY,
} from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import { prepareMultiSeriesChartData } from '@/src/utils/telemetry';
import LineChart from '@/src/components/Telemetry/Dashboards/LineChart/LineChart';

interface Props {
  getData: (input: QueryInput) => Promise<ServerActionResponse>;
  getToolCallsData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  getToolsConsumptionData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime: string;
  isEntityView?: boolean;
}

const McpDashboard: FC<Props> = ({
  getData,
  getToolCallsData,
  getToolsConsumptionData,
  refreshTime,
  isEntityView = false,
}) => {
  const t = useI18n();

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-auto">
      <div className="flex flex-col md:flex-row mb-6 md:flex-wrap gap-6">
        <LineChart
          title={t(TelemetryI18nKey.RequestPerMcpUsage)}
          query={createMcpUsageQuery}
          getData={getData}
          prepareData={prepareMultiSeriesChartData}
          refreshTime={refreshTime}
        />
        <McpChartsValues getData={getData} getToolCallsData={getToolCallsData} refreshTime={refreshTime} />
      </div>
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col md:flex-row gap-6">
          {!isEntityView && (
            <div className="flex flex-1 relative">
              <TelemetryGrid
                getData={getData}
                refreshTime={refreshTime}
                query={MCP_CONSUMPTION_QUERY}
                columnDefs={MCP_CONSUMPTION_COLUMNS}
                title={t(TelemetryI18nKey.McpConsumption)}
              />
            </div>
          )}
          <div className="flex flex-1 relative">
            <TelemetryGrid
              getData={getToolsConsumptionData}
              refreshTime={refreshTime}
              query={MCP_TOOLS_CONSUMPTION_QUERY}
              columnDefs={TOOLS_CONSUMPTION_COLUMNS}
              title={t(TelemetryI18nKey.ToolsConsumption)}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-1 relative">
            <TelemetryGrid
              getData={getData}
              refreshTime={refreshTime}
              query={MCP_CALLS_BY_DEPLOYMENT_QUERY}
              columnDefs={MCP_CALLS_BY_DEPLOYMENT_COLUMNS}
              title={t(TelemetryI18nKey.CallsFromParentDeployments)}
            />
          </div>
          <div className="flex flex-1 relative">
            <TelemetryGrid
              getData={getData}
              refreshTime={refreshTime}
              query={MCP_PROJECTS_CONSUMPTION_QUERY}
              columnDefs={MCP_PROJECTS_CONSUMPTION_COLUMNS}
              title={t(TelemetryI18nKey.CallsByProject)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default McpDashboard;
