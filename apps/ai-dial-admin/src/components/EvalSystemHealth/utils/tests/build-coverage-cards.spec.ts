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

const coveredOf = (...ids: string[]): CoveredIds => new Set(ids);

const sourcesOf = (overrides: Partial<CoverageSources> = {}): CoverageSources => ({
  deployments: ready(listedOf()),
  covered: ready(coveredOf('model-0', 'model-1', 'model-2', 'app-0', 'toolset-0')),
  ...overrides,
});

const cardOf = (cards: CoverageCardModel[], kind: CoverageKind): CoverageCardModel =>
  cards.find((card) => card.kind === kind) as CoverageCardModel;

describe('buildCoverageCards', () => {
  test('returns the four cards in display order', () => {
    expect(buildCoverageCards(sourcesOf()).map((card) => card.kind)).toEqual([
      CoverageKind.Evaluatees,
      CoverageKind.Models,
      CoverageKind.Applications,
      CoverageKind.Toolsets,
    ]);
  });

  test('counts total, covered and uncovered per kind', () => {
    const cards = buildCoverageCards(sourcesOf());

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 4, covered: 3, uncovered: 1, rate: 0.75 });
    expect(cardOf(cards, CoverageKind.Applications)).toMatchObject({ total: 2, covered: 1, uncovered: 1, rate: 0.5 });
    expect(cardOf(cards, CoverageKind.Toolsets)).toMatchObject({ total: 1, covered: 1, uncovered: 0, rate: 1 });
  });

  test('sums the three kinds for the evaluatees card', () => {
    const evaluatees = cardOf(buildCoverageCards(sourcesOf()), CoverageKind.Evaluatees);

    expect(evaluatees).toMatchObject({ total: 7, covered: 5, uncovered: 2 });
    expect(evaluatees.rate).toBeCloseTo(5 / 7);
  });

  test('covers an application that a suite reaches through an MCP tool just as one that calls it directly', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ applications: ['mcp-app'] })),
        covered: ready(coveredOf('mcp-app')),
      }),
    );

    expect(cardOf(cards, CoverageKind.Applications)).toMatchObject({ total: 1, covered: 1 });
  });

  test('counts an evaluatee covered by many runs once', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ models: ['gpt-4o', 'gpt-4o'] })),
        covered: ready(coveredOf('gpt-4o')),
      }),
    );

    expect(cardOf(cards, CoverageKind.Models)).toMatchObject({ total: 1, covered: 1 });
  });

  test('leaves out a covered id that is no longer deployed', () => {
    const cards = buildCoverageCards(
      sourcesOf({
        deployments: ready(listedOf({ models: ['gpt-4o'] })),
        covered: ready(coveredOf('gpt-4o', 'retired-model')),
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
        covered: ready(coveredOf('Code Apps')),
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
    const cards = buildCoverageCards({ deployments: loading(), covered: loading() });

    expect(cards.every((card) => card.status === CoverageStatus.Loading)).toBe(true);
    expect(cards.every((card) => card.rate === null && card.total === 0)).toBe(true);
  });

  test('keeps every card loading while only one source has returned', () => {
    expect(
      buildCoverageCards(sourcesOf({ covered: loading() })).every((card) => card.status === CoverageStatus.Loading),
    ).toBe(true);
    expect(
      buildCoverageCards(sourcesOf({ deployments: loading() })).every((card) => card.status === CoverageStatus.Loading),
    ).toBe(true);
  });

  test('errors every card when the deployment listing failed', () => {
    const cards = buildCoverageCards(sourcesOf({ deployments: failed() }));

    expect(cards.every((card) => card.status === CoverageStatus.Error)).toBe(true);
  });

  test('errors every card when the coverage query failed', () => {
    const cards = buildCoverageCards(sourcesOf({ covered: failed() }));

    expect(cards.every((card) => card.status === CoverageStatus.Error)).toBe(true);
  });

  test('prefers error over loading when one source failed and the other is pending', () => {
    const cards = buildCoverageCards({ deployments: failed(), covered: loading() });

    expect(cards.every((card) => card.status === CoverageStatus.Error)).toBe(true);
  });

  test('zeroes the counts of cards that are not ready', () => {
    const models = cardOf(buildCoverageCards(sourcesOf({ deployments: failed() })), CoverageKind.Models);

    expect(models).toMatchObject({ total: 0, covered: 0, uncovered: 0, rate: null });
  });
});
