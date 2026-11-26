import { describe, expect, test } from 'vitest';

import {
  CoverageCardModel,
  CoverageKind,
  CoverageSource,
  CoverageSources,
  CoverageStatus,
  CoveredIds,
  ListedDeploymentIds,
} from '@/src/components/EvalSystemHealth/models';
import { buildCoverageCards } from '@/src/components/EvalSystemHealth/utils/build-coverage-cards';

const ready = <T>(value: T): CoverageSource<T> => ({ status: CoverageStatus.Ready, value });
const loading = <T>(): CoverageSource<T> => ({ status: CoverageStatus.Loading });
const failed = <T>(): CoverageSource<T> => ({ status: CoverageStatus.Error });

const ids = (prefix: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}-${index}`);

const listedOf = (overrides: Partial<ListedDeploymentIds> = {}): ListedDeploymentIds => ({
  models: ids('model', 4),
  applications: ids('app', 2),
  toolsets: ids('toolset', 1),
  ...overrides,
});

const coveredOf = (deployments: string[] = [], routes: string[] = []): CoveredIds => ({
  deployments: new Set(deployments),
  routes: new Set(routes),
});

const sourcesOf = (overrides: Partial<CoverageSources> = {}): CoverageSources => ({
  deployments: ready(listedOf()),
  routes: ready(['route-0', 'route-1', 'route-2']),
  covered: ready(coveredOf(['model-0', 'model-1', 'model-2', 'app-0', 'toolset-0'], ['route-0'])),
  ...overrides,
});

const allLoading = (): CoverageSources => ({ deployments: loading(), routes: loading(), covered: loading() });

const statusesOf = (sources: CoverageSources): Record<string, CoverageStatus> =>
  Object.fromEntries(buildCoverageCards(sources).map((card) => [card.kind, card.status]));

const cardOf = (cards: CoverageCardModel[], kind: CoverageKind): CoverageCardModel =>
  cards.find((card) => card.kind === kind) as CoverageCardModel;

describe('buildCoverageCards', () => {
  test('returns the five cards in display order', () => {
    expect(buildCoverageCards(sourcesOf()).map((card) => card.kind)).toEqual([
      CoverageKind.Evaluatees,
      CoverageKind.Models,
      CoverageKind.Applications,
      CoverageKind.Toolsets,
      CoverageKind.Routes,
    ]);
  });

  test('counts total, covered and uncovered per kind', () => {
    const cards = buildCoverageCards(sourcesOf());

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 4, covered: 3, uncovered: 1, rate: 0.75 });
    expect(cardOf(cards, CoverageKind.Applications)).toMatchObject({ total: 2, covered: 1, uncovered: 1, rate: 0.5 });
    expect(cardOf(cards, CoverageKind.Toolsets)).toMatchObject({ total: 1, covered: 1, uncovered: 0, rate: 1 });
    expect(cardOf(cards, CoverageKind.Routes)).toMatchObject({ total: 3, covered: 1, uncovered: 2 });
  });

  test('sums the four kinds, routes included, for the evaluatees card', () => {
    const evaluatees = cardOf(buildCoverageCards(sourcesOf()), CoverageKind.Evaluatees);

    expect(evaluatees).toMatchObject({ total: 10, covered: 6, uncovered: 4 });
    expect(evaluatees.rate).toBeCloseTo(6 / 10);
  });

  test('lets routes alone make up the evaluatees', () => {
    const evaluatees = cardOf(
      buildCoverageCards(
        sourcesOf({
          deployments: ready(listedOf({ models: [], applications: [], toolsets: [] })),
          routes: ready(['a', 'b', 'c', 'd']),
          covered: ready(coveredOf([], ['a', 'b', 'c'])),
        }),
      ),
      CoverageKind.Evaluatees,
    );

    expect(evaluatees).toMatchObject({ total: 4, covered: 3, uncovered: 1, rate: 0.75 });
  });

  test('counts a route covered by many runs once, and one listed twice once', () => {
    const routes = cardOf(
      buildCoverageCards(sourcesOf({ routes: ready(['echo', 'echo']), covered: ready(coveredOf([], ['echo'])) })),
      CoverageKind.Routes,
    );

    expect(routes).toMatchObject({ total: 1, covered: 1 });
  });

  test('leaves out a covered route that is no longer listed', () => {
    const routes = cardOf(
      buildCoverageCards(sourcesOf({ routes: ready(['echo']), covered: ready(coveredOf([], ['echo', 'retired'])) })),
      CoverageKind.Routes,
    );

    expect(routes).toMatchObject({ total: 1, covered: 1, uncovered: 0 });
  });

  test('never lets a deployment id cover a route or a route name cover a deployment', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ models: ['shared'], applications: [], toolsets: [] })),
        routes: ready(['shared']),
        covered: ready(coveredOf(['shared'], [])),
      }),
    );

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 1, covered: 1 });
    expect(cardOf(cards, CoverageKind.Routes)).toMatchObject({ total: 1, covered: 0 });
  });

  test('gives no routes a null rate instead of a percentage', () => {
    const routes = cardOf(
      buildCoverageCards(sourcesOf({ routes: ready([]), covered: ready(coveredOf()) })),
      CoverageKind.Routes,
    );

    expect(routes).toMatchObject({ status: CoverageStatus.Ready, total: 0, covered: 0, uncovered: 0, rate: null });
  });

  test('covers an application that a suite reaches through an MCP tool just as one that calls it directly', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ applications: ['mcp-app'] })),
        covered: ready(coveredOf(['mcp-app'])),
      }),
    );

    expect(cardOf(cards, CoverageKind.Applications)).toMatchObject({ total: 1, covered: 1 });
  });

  test('counts an evaluatee covered by many runs once', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ models: ['gpt-4o', 'gpt-4o'] })),
        covered: ready(coveredOf(['gpt-4o'])),
      }),
    );

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 1, covered: 1 });
  });

  test('leaves out a covered id that is no longer deployed', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ models: ['gpt-4o'] })),
        covered: ready(coveredOf(['gpt-4o', 'retired-model'])),
      }),
    );

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 1, covered: 1, uncovered: 0 });
  });

  test('counts an evaluatee with no run in the window as uncovered', () => {
    const cards = buildCoverageCards(
      sourcesOf({ deployments: ready(listedOf({ models: ['gpt-4o'] })), covered: ready(coveredOf()) }),
    );

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 1, covered: 0, uncovered: 1, rate: 0 });
  });

  test('matches a listed id written URI-encoded to the decoded id the coverage set holds', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ applications: ['Code%20Apps'] })),
        covered: ready(coveredOf(['Code Apps'])),
      }),
    );

    expect(cardOf(cards, CoverageKind.Applications).covered).toBe(1);
  });

  test('gives a kind with no deployments a null rate instead of a percentage', () => {
    const toolsets = cardOf(
      buildCoverageCards(sourcesOf({ deployments: ready(listedOf({ toolsets: [] })), covered: ready(coveredOf()) })),
      CoverageKind.Toolsets,
    );

    expect(toolsets).toMatchObject({ status: CoverageStatus.Ready, total: 0, covered: 0, uncovered: 0, rate: null });
  });

  test('reports every card as loading while nothing has returned', () => {
    const cards = buildCoverageCards(allLoading());

    expect(cards.every((card) => card.status === CoverageStatus.Loading)).toBe(true);
    expect(cards.every((card) => card.rate === null && card.total === 0)).toBe(true);
  });

  test('keeps every card loading while the coverage query has not returned', () => {
    expect(
      buildCoverageCards(sourcesOf({ covered: loading() })).every((card) => card.status === CoverageStatus.Loading),
    ).toBe(true);
  });

  test('keeps the deployment cards loading while their listing has not returned, though the routes have', () => {
    expect(statusesOf(sourcesOf({ deployments: loading() }))).toEqual({
      [CoverageKind.Evaluatees]: CoverageStatus.Loading,
      [CoverageKind.Models]: CoverageStatus.Loading,
      [CoverageKind.Applications]: CoverageStatus.Loading,
      [CoverageKind.Toolsets]: CoverageStatus.Loading,
      [CoverageKind.Routes]: CoverageStatus.Ready,
    });
  });

  test('shows the deployment cards while the route listing is the last to return', () => {
    expect(statusesOf(sourcesOf({ routes: loading() }))).toEqual({
      [CoverageKind.Evaluatees]: CoverageStatus.Loading,
      [CoverageKind.Models]: CoverageStatus.Ready,
      [CoverageKind.Applications]: CoverageStatus.Ready,
      [CoverageKind.Toolsets]: CoverageStatus.Ready,
      [CoverageKind.Routes]: CoverageStatus.Loading,
    });
  });

  test('errors the deployment cards and the evaluatees, not routes, when the deployment listing failed', () => {
    expect(statusesOf(sourcesOf({ deployments: failed() }))).toEqual({
      [CoverageKind.Evaluatees]: CoverageStatus.Error,
      [CoverageKind.Models]: CoverageStatus.Error,
      [CoverageKind.Applications]: CoverageStatus.Error,
      [CoverageKind.Toolsets]: CoverageStatus.Error,
      [CoverageKind.Routes]: CoverageStatus.Ready,
    });
  });

  test('errors only routes and the evaluatees when the route listing failed', () => {
    const cards = buildCoverageCards(sourcesOf({ routes: failed() }));

    expect(statusesOf(sourcesOf({ routes: failed() }))).toEqual({
      [CoverageKind.Evaluatees]: CoverageStatus.Error,
      [CoverageKind.Models]: CoverageStatus.Ready,
      [CoverageKind.Applications]: CoverageStatus.Ready,
      [CoverageKind.Toolsets]: CoverageStatus.Ready,
      [CoverageKind.Routes]: CoverageStatus.Error,
    });
    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 4, covered: 3 });
  });

  test('errors every card when the coverage query failed', () => {
    const cards = buildCoverageCards(sourcesOf({ covered: failed() }));

    expect(cards.every((card) => card.status === CoverageStatus.Error)).toBe(true);
  });

  test('prefers error over loading when one source failed and the others are pending', () => {
    const cards = buildCoverageCards({ deployments: failed(), routes: loading(), covered: loading() });

    expect(cardOf(cards, CoverageKind.Models).status).toBe(CoverageStatus.Error);
    expect(cardOf(cards, CoverageKind.Evaluatees).status).toBe(CoverageStatus.Error);
    expect(cardOf(cards, CoverageKind.Routes).status).toBe(CoverageStatus.Loading);
  });

  test('zeroes the counts of cards that are not ready', () => {
    const models = cardOf(buildCoverageCards(sourcesOf({ deployments: failed() })), CoverageKind.Models);

    expect(models).toMatchObject({ total: 0, covered: 0, uncovered: 0, rate: null });
  });
});
