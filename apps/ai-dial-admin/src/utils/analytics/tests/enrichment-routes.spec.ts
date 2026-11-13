import { describe, expect, test } from 'vitest';

import { EnrichmentRouteProblem, EnrichmentRouteRow } from '@/src/models/analytics/enrichment-routes';
import { DialApplication } from '@/src/models/dial/application';
import {
  createRouteRow,
  getDeploymentProblem,
  getRouteProblem,
  getRouteRowProblems,
  getRouteSuggestions,
  isBlankRoute,
  isRouteListFull,
  isRouteListed,
  toRoutePairs,
  toRouteRows,
  toRouteSuggestions,
} from '@/src/utils/analytics/enrichment-routes';

const row = (id: string, deployment: string, route: string): EnrichmentRouteRow => ({ id, deployment, route });

describe('Utils :: analytics :: getDeploymentProblem', () => {
  test('accepts a deployment id, including one that carries a slash', () => {
    expect(getDeploymentProblem('insights-app')).toBeUndefined();
    expect(getDeploymentProblem('team/insights-app')).toBeUndefined();
  });

  test('reports a blank deployment as required', () => {
    expect(getDeploymentProblem('')).toBe(EnrichmentRouteProblem.DeploymentRequired);
    expect(getDeploymentProblem('   ')).toBe(EnrichmentRouteProblem.DeploymentRequired);
  });

  test('reports a deployment longer than 256 characters', () => {
    expect(getDeploymentProblem('a'.repeat(256))).toBeUndefined();
    expect(getDeploymentProblem('a'.repeat(257))).toBe(EnrichmentRouteProblem.DeploymentTooLong);
  });

  test.each(['my app', 'app?x', 'app#x', 'app%20', 'app\t', 'team\\app', 'app\u200b'])(
    'refuses the forbidden character in %j',
    (value) => {
      expect(getDeploymentProblem(value)).toBe(EnrichmentRouteProblem.DeploymentForbidden);
    },
  );
});

describe('Utils :: analytics :: getDeploymentProblem — segments', () => {
  test.each(['/app', 'app/', 'team//app', 'a/../x', 'a/./x', '..'])('refuses the broken segment in %j', (value) => {
    expect(getDeploymentProblem(value)).toBe(EnrichmentRouteProblem.DeploymentMalformed);
  });
});

describe('Utils :: analytics :: getRouteSuggestions', () => {
  const suggestions = { deployments: ['app'], routesByDeployment: { app: ['insights'] } };

  test('returns the routes of a listed deployment', () => {
    expect(getRouteSuggestions(suggestions, 'app')).toEqual(['insights']);
  });

  test.each(['other', '', 'constructor', 'toString', '__proto__'])('returns no routes for %j', (deployment) => {
    expect(getRouteSuggestions(suggestions, deployment)).toEqual([]);
  });
});

describe('Utils :: analytics :: getRouteProblem', () => {
  test.each(['insights', 'v1/insights', 'a.b_c~d-e/f'])('accepts the route %j', (value) => {
    expect(getRouteProblem(value)).toBeUndefined();
  });

  test('reports a blank route as required', () => {
    expect(getRouteProblem('')).toBe(EnrichmentRouteProblem.RouteRequired);
  });

  test('reports a route longer than 256 characters', () => {
    expect(getRouteProblem('a'.repeat(257))).toBe(EnrichmentRouteProblem.RouteTooLong);
  });

  test.each(['/insights', 'insights/', 'a//b', 'a?b', 'a#b', 'a%2Fb', 'a b', '.', 'a/../b', 'a/./b', 'items/\\d+'])(
    'refuses the malformed route %j',
    (value) => {
      expect(getRouteProblem(value)).toBe(EnrichmentRouteProblem.RouteMalformed);
    },
  );
});

describe('Utils :: analytics :: getRouteRowProblems', () => {
  test('reports nothing for valid, distinct pairs', () => {
    expect(getRouteRowProblems([row('1', 'app', 'a'), row('2', 'app', 'b')])).toEqual({});
  });

  test('reports each field of an invalid row under its id', () => {
    expect(getRouteRowProblems([row('1', '', '/a')])).toEqual({
      '1': { deployment: EnrichmentRouteProblem.DeploymentRequired, route: EnrichmentRouteProblem.RouteMalformed },
    });
  });

  test('marks the later row of a repeated pair', () => {
    expect(getRouteRowProblems([row('1', 'app', 'a'), row('2', 'app', 'a')])).toEqual({
      '2': { deployment: undefined, route: EnrichmentRouteProblem.Repeated },
    });
  });

  test('treats pairs that differ only in case as distinct', () => {
    expect(getRouteRowProblems([row('1', 'app', 'Insights'), row('2', 'app', 'insights')])).toEqual({});
  });

  test('ignores a row whose two fields are blank', () => {
    expect(getRouteRowProblems([row('1', '', ' ')])).toEqual({});
  });
});

describe('Utils :: analytics :: enrichment route rows', () => {
  test('seeds rows with distinct ids from the stored pairs', () => {
    const rows = toRouteRows([
      { deployment: 'app', route: 'a' },
      { deployment: 'app', route: 'b' },
    ]);

    expect(rows.map(({ deployment, route }) => [deployment, route])).toEqual([
      ['app', 'a'],
      ['app', 'b'],
    ]);
    expect(rows[0].id).not.toBe(rows[1].id);
  });

  test('seeds no rows from no stored list and an empty row by default', () => {
    expect(toRouteRows()).toEqual([]);
    expect(createRouteRow()).toEqual(expect.objectContaining({ deployment: '', route: '' }));
  });

  test('drops blank rows and row ids when building the pairs to send', () => {
    expect(toRoutePairs([row('1', 'app', 'a'), row('2', '', '')])).toEqual([{ deployment: 'app', route: 'a' }]);
  });

  test('tells a blank row from a half-filled one', () => {
    expect(isBlankRoute({ deployment: ' ', route: '' })).toBe(true);
    expect(isBlankRoute({ deployment: 'app', route: '' })).toBe(false);
  });

  test('reports the list as full at 100 rows', () => {
    const rows = Array.from({ length: 100 }, (_, index) => row(String(index), 'app', `r${index}`));

    expect(isRouteListFull(rows)).toBe(true);
    expect(isRouteListFull(rows.slice(1))).toBe(false);
  });
});

describe('Utils :: analytics :: isRouteListed', () => {
  const routes = [{ deployment: 'app', route: 'insights' }];

  test('finds an exact pair', () => {
    expect(isRouteListed(routes, 'app', 'insights')).toBe(true);
  });

  test('compares case-sensitively and against both members', () => {
    expect(isRouteListed(routes, 'app', 'Insights')).toBe(false);
    expect(isRouteListed(routes, 'other', 'insights')).toBe(false);
    expect(isRouteListed([], 'app', 'insights')).toBe(false);
  });
});

describe('Utils :: analytics :: toRouteSuggestions', () => {
  const application = (overrides: Partial<DialApplication>): DialApplication => overrides as DialApplication;

  test('lists each application and its route paths without the leading slash', () => {
    const suggestions = toRouteSuggestions([
      application({
        name: 'insights-app',
        routes: [{ paths: ['/insights', '/v1/summary'] }, { paths: ['/insights'] }],
      }),
      application({ name: 'plain-app' }),
    ]);

    expect(suggestions).toEqual({
      deployments: ['insights-app', 'plain-app'],
      routesByDeployment: { 'insights-app': ['insights', 'v1/summary'], 'plain-app': [] },
    });
  });

  test('skips an application without a name and reads no listing as no suggestions', () => {
    expect(toRouteSuggestions([application({ routes: [{ paths: ['/a'] }] })])).toEqual({
      deployments: [],
      routesByDeployment: {},
    });
    expect(toRouteSuggestions()).toEqual({ deployments: [], routesByDeployment: {} });
  });
});
