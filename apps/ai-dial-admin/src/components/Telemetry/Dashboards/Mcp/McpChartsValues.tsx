import { FC } from 'react';

import { TelemetryI18nKey } from '@/src/constants/i18n';
import { MCP_TOTAL_CALLS_QUERY, MCP_TOOL_CALLS_QUERY, MCP_UNIQUE_USERS_QUERY } from '@/src/constants/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import SingleValueChart from '@/src/components/Telemetry/Dashboards/Values/SingleValueChart';

interface Props {
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  getToolCallsData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const McpChartsValues: FC<Props> = ({ getData, getToolCallsData, refreshTime }) => {
  return (
    <div className="flex flex-col shrink-0 overflow-auto gap-6">
      <SingleValueChart
        title={TelemetryI18nKey.UniqueUsers}
        getData={getData}
        refreshTime={refreshTime}
        query={MCP_UNIQUE_USERS_QUERY}
      />
      <div className="grid grid-cols-2 gap-6 w-full">
        <SingleValueChart
          title={TelemetryI18nKey.TotalMcpCalls}
          getData={getData}
          refreshTime={refreshTime}
          query={MCP_TOTAL_CALLS_QUERY}
        />
        <SingleValueChart
          title={TelemetryI18nKey.TotalToolCalls}
          getData={getToolCallsData}
          refreshTime={refreshTime}
          query={MCP_TOOL_CALLS_QUERY}
        />
      </div>
    </div>
  );
};

export default McpChartsValues;
