import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import McpDashboard from '../Dashboards/Mcp/McpDashboard';
import { TelemetryI18nKey } from '@/src/constants/i18n';

const getData = vi.fn().mockResolvedValue({ success: false });
const getToolCallsData = vi.fn().mockResolvedValue({ success: false });
const getToolsConsumptionData = vi.fn().mockResolvedValue({ success: false });

describe('McpDashboard', () => {
  test('renders chart placeholder, stat cards, and all tables in global view', () => {
    render(
      <McpDashboard
        getData={getData}
        getToolCallsData={getToolCallsData}
        getToolsConsumptionData={getToolsConsumptionData}
        refreshTime="1m"
      />,
    );

    expect(screen.getByText(TelemetryI18nKey.RequestPerMcpUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.UniqueUsers)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalMcpCalls)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalToolCalls)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.McpConsumption)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.ToolsConsumption)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.CallsByDeployment)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.CallsByProject)).toBeInTheDocument();
  });

  test('hides MCP Consumption table in entity view', () => {
    render(
      <McpDashboard
        getData={getData}
        getToolCallsData={getToolCallsData}
        getToolsConsumptionData={getToolsConsumptionData}
        refreshTime="1m"
        isEntityView
      />,
    );

    expect(screen.queryByText(TelemetryI18nKey.McpConsumption)).toBeNull();
    expect(screen.getByText(TelemetryI18nKey.ToolsConsumption)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.CallsByDeployment)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.CallsByProject)).toBeInTheDocument();
  });
});
