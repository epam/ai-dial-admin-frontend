import { describe, expect, test } from 'vitest';

import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import {
  formatDeploymentName,
  getFallbackLabelKey,
  getFallbackTooltipKey,
  isFallbackRowPinnedLast,
} from '@/src/components/Analytics/Usage/utils/labels';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

describe('getFallbackLabelKey', () => {
  test('names no tool fallback, since the view reads only rows that name a tool', () => {
    expect(getFallbackLabelKey(BreakdownTab.Tools)).toBeNull();
  });

  test('names a row with no project and one with no application', () => {
    expect(getFallbackLabelKey(BreakdownTab.Projects)).toBe(AnalyticsUsageI18nKey.NoProject);
    expect(getFallbackLabelKey(BreakdownTab.Applications)).toBe(AnalyticsUsageI18nKey.DirectCall);
  });

  test.each([BreakdownTab.Models, BreakdownTab.McpServers])('leaves %s to its own value', (tab) => {
    expect(getFallbackLabelKey(tab)).toBeNull();
  });
});

describe('getFallbackTooltipKey', () => {
  test.each([UsageView.Llm, UsageView.Mcp])('explains no tool fallback in %s, there being none', (view) => {
    expect(getFallbackTooltipKey(BreakdownTab.Tools, view)).toBeNull();
  });

  test('explains a direct call by the view it was made in', () => {
    expect(getFallbackTooltipKey(BreakdownTab.Applications, UsageView.Mcp)).toBe(
      AnalyticsUsageI18nKey.DirectCallMcpTooltip,
    );
    expect(getFallbackTooltipKey(BreakdownTab.Applications, UsageView.Llm)).toBe(
      AnalyticsUsageI18nKey.DirectCallRouteTooltip,
    );
  });

  test.each([BreakdownTab.Models, BreakdownTab.McpServers])('offers no explanation for %s', (tab) => {
    expect(getFallbackTooltipKey(tab, UsageView.Mcp)).toBeNull();
  });
});

describe('isFallbackRowPinnedLast', () => {
  test.each([
    BreakdownTab.Models,
    BreakdownTab.Applications,
    BreakdownTab.Projects,
    BreakdownTab.McpServers,
    BreakdownTab.Tools,
  ])('leaves %s to its own ranking', (tab) => {
    expect(isFallbackRowPinnedLast(tab)).toBe(false);
  });
});

describe('formatDeploymentName', () => {
  test('drops the toolset prefix, which the column already states', () => {
    expect(formatDeploymentName('toolsets/public/dial-core-mcp__1.0.0')).toBe('public/dial-core-mcp__1.0.0');
  });

  test('decodes the escapes Core addresses a name by', () => {
    expect(formatDeploymentName('toolsets/public/YH%20notion%20toolset%2013.08__1.0.1')).toBe(
      'public/YH notion toolset 13.08__1.0.1',
    );
  });

  test('leaves a plain deployment name alone', () => {
    expect(formatDeploymentName('dev-grafana-mcp')).toBe('dev-grafana-mcp');
  });

  test('keeps a name that is not valid percent-encoding rather than failing on it', () => {
    expect(formatDeploymentName('toolsets/public/100%-coverage')).toBe('public/100%-coverage');
  });
});
