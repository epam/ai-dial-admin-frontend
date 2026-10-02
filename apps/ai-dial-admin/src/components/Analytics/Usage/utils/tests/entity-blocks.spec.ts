import { describe, expect, test } from 'vitest';

import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import {
  getBlockTabs,
  getEntityBlocks,
  hasEntityDashboard,
} from '@/src/components/Analytics/Usage/utils/entity-blocks';
import { ApplicationRoute } from '@/src/types/routes';

describe('getEntityBlocks', () => {
  test.each([ApplicationRoute.Models, ApplicationRoute.PlatformModels])('gives a %s one LLM block', (route) => {
    expect(getEntityBlocks(route)).toEqual([{ view: UsageView.Llm, hiddenTab: BreakdownTab.Models }]);
  });

  test.each([ApplicationRoute.Toolsets, ApplicationRoute.AssetsToolsets])('gives a %s one MCP block', (route) => {
    expect(getEntityBlocks(route)).toEqual([{ view: UsageView.Mcp, hiddenTab: BreakdownTab.McpServers }]);
  });

  test('gives a route the dashboard does not serve no blocks', () => {
    expect(getEntityBlocks(ApplicationRoute.Roles)).toEqual([]);
    expect(hasEntityDashboard(ApplicationRoute.Roles)).toBe(false);
    expect(hasEntityDashboard(ApplicationRoute.Models)).toBe(true);
  });
});

describe('getBlockTabs', () => {
  test("drops the tab that would rank the entity alone, keeping the view's order", () => {
    expect(getBlockTabs({ view: UsageView.Llm, hiddenTab: BreakdownTab.Models })).toEqual([
      BreakdownTab.Applications,
      BreakdownTab.Projects,
    ]);
    expect(getBlockTabs({ view: UsageView.Mcp, hiddenTab: BreakdownTab.McpServers })).toEqual([
      BreakdownTab.Tools,
      BreakdownTab.Applications,
      BreakdownTab.Projects,
    ]);
  });
});
