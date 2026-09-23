import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

const TOOLSET_PREFIX = 'toolsets/';

/**
 * What a row whose dimension value is missing is called. A call with no project was made outside
 * any project; a call with no application was made against the model directly; a call with no tool
 * name is a protocol method — `initialize`, `tools/list`, a notification — which the MCP transport
 * logs the same way it logs `tools/call`, and which outnumbers the tool calls themselves.
 */
export const getFallbackLabelKey = (tab: BreakdownTab): AnalyticsUsageI18nKey | null => {
  if (tab === BreakdownTab.Projects) {
    return AnalyticsUsageI18nKey.NoProject;
  }

  if (tab === BreakdownTab.Applications) {
    return AnalyticsUsageI18nKey.DirectCall;
  }

  if (tab === BreakdownTab.Tools) {
    return AnalyticsUsageI18nKey.OtherMethods;
  }

  return null;
};

/**
 * Whether the tab's fallback row is pinned below the ranked ones. On the `Tools` tab it is: the
 * protocol methods outnumber the tool calls several times over, so ranking the bucket by its calls
 * would put the one row nobody came for at the top and push the tools out of the card's page.
 */
export const isFallbackRowPinnedLast = (tab: BreakdownTab): boolean => tab === BreakdownTab.Tools;

export const getFallbackTooltipKey = (tab: BreakdownTab, view: UsageView): AnalyticsUsageI18nKey | null => {
  if (tab === BreakdownTab.Projects) {
    return AnalyticsUsageI18nKey.NoProjectTooltip;
  }

  if (tab === BreakdownTab.Tools) {
    return AnalyticsUsageI18nKey.OtherMethodsTooltip;
  }

  if (tab !== BreakdownTab.Applications) {
    return null;
  }

  return view === UsageView.Mcp
    ? AnalyticsUsageI18nKey.DirectCallMcpTooltip
    : AnalyticsUsageI18nKey.DirectCallRouteTooltip;
};

/**
 * A deployment path as a reader can take it in.
 *
 * A toolset arrives as the path Core addresses it by — `toolsets/public/YH%20notion%20toolset` — so
 * the prefix says only "this is a toolset", which the column already says, and the escapes are
 * Core's own encoding rather than part of the name.
 */
export const formatDeploymentName = (raw: string): string => {
  const withoutPrefix = raw.startsWith(TOOLSET_PREFIX) ? raw.slice(TOOLSET_PREFIX.length) : raw;

  try {
    return decodeURIComponent(withoutPrefix);
  } catch {
    // A name carrying a stray `%` is not valid percent-encoding; it is still a name.
    return withoutPrefix;
  }
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

/** What each tab counts and what one of its rows aggregates, stated under the card's title. */
export const BREAKDOWN_TAB_DESCRIPTION_KEY: Record<BreakdownTab, AnalyticsUsageI18nKey> = {
  [BreakdownTab.Models]: AnalyticsUsageI18nKey.BreakdownDescriptionModels,
  [BreakdownTab.Applications]: AnalyticsUsageI18nKey.BreakdownDescriptionApplications,
  [BreakdownTab.Projects]: AnalyticsUsageI18nKey.BreakdownDescriptionProjects,
  [BreakdownTab.McpServers]: AnalyticsUsageI18nKey.BreakdownDescriptionMcpServers,
  [BreakdownTab.Tools]: AnalyticsUsageI18nKey.BreakdownDescriptionTools,
};
