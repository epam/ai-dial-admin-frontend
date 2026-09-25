import { BreakdownTab, ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
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

  return null;
};

/**
 * Whether the tab's fallback row is pinned below the ranked ones. No tab pins one today: the rule
 * existed for the `Tools` bucket of protocol methods, and the MCP view no longer reads those rows
 * at all. Kept as the one place to answer the question, rather than as a rule spread over callers.
 */
export const isFallbackRowPinnedLast = (_tab: BreakdownTab): boolean => false;

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

/**
 * What the compared window is called inside a sentence, as against the capitalized option in the
 * selector. `Off` carries one so the record is total; nothing renders it.
 */
export const COMPARE_NAME_KEY: Record<ComparePeriod, AnalyticsUsageI18nKey> = {
  [ComparePeriod.Off]: AnalyticsUsageI18nKey.CompareNamePreviousPeriod,
  [ComparePeriod.PreviousPeriod]: AnalyticsUsageI18nKey.CompareNamePreviousPeriod,
  [ComparePeriod.PreviousMonth]: AnalyticsUsageI18nKey.CompareNamePreviousMonth,
  [ComparePeriod.PreviousYear]: AnalyticsUsageI18nKey.CompareNamePreviousYear,
};
