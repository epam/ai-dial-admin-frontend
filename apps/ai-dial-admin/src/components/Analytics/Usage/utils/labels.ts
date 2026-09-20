import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

/**
 * What a row whose dimension value is missing is called. A call with no project was made outside
 * any project; a call with no application was made against the model directly.
 */
export const getFallbackLabelKey = (tab: BreakdownTab): AnalyticsUsageI18nKey | null => {
  if (tab === BreakdownTab.Projects) {
    return AnalyticsUsageI18nKey.NoProject;
  }

  if (tab === BreakdownTab.Applications) {
    return AnalyticsUsageI18nKey.DirectCall;
  }

  return null;
};

export const getFallbackTooltipKey = (tab: BreakdownTab, view: UsageView): AnalyticsUsageI18nKey | null => {
  if (tab === BreakdownTab.Projects) {
    return AnalyticsUsageI18nKey.NoProjectTooltip;
  }

  if (tab !== BreakdownTab.Applications) {
    return null;
  }

  return view === UsageView.Mcp
    ? AnalyticsUsageI18nKey.DirectCallMcpTooltip
    : AnalyticsUsageI18nKey.DirectCallRouteTooltip;
};

export const BREAKDOWN_TAB_LABEL_KEY: Record<BreakdownTab, AnalyticsUsageI18nKey> = {
  [BreakdownTab.Models]: AnalyticsUsageI18nKey.BreakdownTabModels,
  [BreakdownTab.Applications]: AnalyticsUsageI18nKey.BreakdownTabApplications,
  [BreakdownTab.Projects]: AnalyticsUsageI18nKey.BreakdownTabProjects,
  [BreakdownTab.McpServers]: AnalyticsUsageI18nKey.BreakdownTabMcpServers,
  [BreakdownTab.Tools]: AnalyticsUsageI18nKey.BreakdownTabTools,
};

export const BREAKDOWN_TAB_COLUMN_LABEL_KEY: Record<BreakdownTab, AnalyticsUsageI18nKey> = {
  [BreakdownTab.Models]: AnalyticsUsageI18nKey.ColumnModel,
  [BreakdownTab.Applications]: AnalyticsUsageI18nKey.ColumnApplication,
  [BreakdownTab.Projects]: AnalyticsUsageI18nKey.ColumnProject,
  [BreakdownTab.McpServers]: AnalyticsUsageI18nKey.ColumnMcpServer,
  [BreakdownTab.Tools]: AnalyticsUsageI18nKey.ColumnTool,
};
