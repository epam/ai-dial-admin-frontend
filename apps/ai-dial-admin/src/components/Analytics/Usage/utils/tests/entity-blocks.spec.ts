import { describe, expect, test } from 'vitest';

import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import {
  getBlockTabs,
  getEntityBlocks,
  hasDeclaredRoutes,
  hasEntityDashboard,
  resolveBlockRows,
} from '@/src/components/Analytics/Usage/utils/entity-blocks';
import { QueryFilterNode } from '@/src/models/analytics/query';
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

const OWN = [{ op: 'eq', args: [] }] as unknown as QueryFilterNode[];
const MADE = [{ op: 'ne', args: [] }] as unknown as QueryFilterNode[];

describe('getEntityBlocks for applications', () => {
  test.each([ApplicationRoute.Applications, ApplicationRoute.AssetsApplications])(
    'gives a %s LLM, MCP and Routes blocks when it declares routes, in that order',
    (route) => {
      expect(getEntityBlocks(route, true).map((block) => block.view)).toEqual([
        UsageView.Llm,
        UsageView.Mcp,
        UsageView.Routes,
      ]);
    },
  );

  test('leaves the Routes block out for an application that declares none', () => {
    expect(getEntityBlocks(ApplicationRoute.Applications).map((block) => block.view)).toEqual([
      UsageView.Llm,
      UsageView.Mcp,
    ]);
  });
});

describe('hasDeclaredRoutes', () => {
  test('reads a list on an admin application and a map on an asset one', () => {
    expect(hasDeclaredRoutes({ routes: [{}] })).toBe(true);
    expect(hasDeclaredRoutes({ routes: { search: {} } })).toBe(true);
  });

  test('reads nothing declared as no routes', () => {
    expect(hasDeclaredRoutes({ routes: [] })).toBe(false);
    expect(hasDeclaredRoutes({ routes: {} })).toBe(false);
    expect(hasDeclaredRoutes({})).toBe(false);
    expect(hasDeclaredRoutes()).toBe(false);
  });
});

const TOOLS = [{ op: 'in', args: [] }] as unknown as QueryFilterNode[];

describe('resolveBlockRows', () => {
  const [llm, mcp] = getEntityBlocks(ApplicationRoute.Applications);
  const appScope = { own: OWN, made: MADE, tools: TOOLS };

  test("reads an application's own figures from its own calls, and its money from its call tree", () => {
    expect(resolveBlockRows(appScope, llm)).toEqual({
      rows: { entityClauses: OWN },
      madeRows: { entityClauses: MADE },
    });
  });

  test("reads an application's MCP block from the tool calls in its tree, and nothing else", () => {
    expect(resolveBlockRows(appScope, mcp)).toEqual({ rows: { entityClauses: TOOLS }, madeRows: null });
  });

  test('reads one set of rows where the block reads nothing from the tree', () => {
    expect(resolveBlockRows({ own: OWN })).toEqual({ rows: { entityClauses: OWN }, madeRows: null });
  });
});
