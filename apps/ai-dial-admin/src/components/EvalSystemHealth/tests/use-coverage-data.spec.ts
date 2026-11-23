import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import { CoverageCardModel, CoverageKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useCoverageData } from '@/src/components/EvalSystemHealth/use-coverage-data';
import { buildCoverageQuery } from '@/src/components/EvalSystemHealth/utils/build-coverage-query';

vi.mock('@/src/app/[lang]/runs/actions', () => ({ executeStructuredQuery: vi.fn() }));
vi.mock('@/src/app/[lang]/test-suites/actions', () => ({ getDeployments: vi.fn() }));

const NOW = new Date('2026-11-19T12:00:00Z').getTime();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const LISTING = {
  success: true,
  response: [
    { $type: 'dial-model', deploymentId: 'model-0' },
    { $type: 'dial-model', deploymentId: 'model-1' },
    { $type: 'dial-model', deploymentId: 'model-2' },
    { $type: 'dial-application', deploymentId: 'app-0' },
    { $type: 'dial-application', deploymentId: 'app-1' },
    { $type: 'dial-toolset', deploymentId: 'toolset-0' },
  ],
};

const mockListing = (listing: unknown = LISTING) => vi.mocked(getDeployments).mockResolvedValue(listing as never);

const mockCoverage = () =>
  vi.mocked(executeStructuredQuery).mockResolvedValue({
    rows: [
      { 'deployment_ref::id': 'model-0', 'mcp_deployment_ref::id': null },
      { 'deployment_ref::id': 'app-0', 'mcp_deployment_ref::id': null },
      { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'toolset-0' },
    ],
  });

const cardOf = (cards: CoverageCardModel[], kind: CoverageKind) =>
  cards.find((card) => card.kind === kind) as CoverageCardModel;

const isEveryCard = (cards: CoverageCardModel[], status: CoverageStatus) =>
  cards.every((card) => card.status === status);

describe('useCoverageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test('starts with every card loading', () => {
    vi.mocked(getDeployments).mockReturnValue(new Promise(() => undefined));
    vi.mocked(executeStructuredQuery).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useCoverageData());

    expect(isEveryCard(result.current, CoverageStatus.Loading)).toBe(true);
  });

  test('returns every card ready with its counts once both sources succeed', async () => {
    mockListing();
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());

    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Ready)).toBe(true));
    expect(cardOf(result.current, CoverageKind.Models)).toMatchObject({ total: 3, covered: 1, uncovered: 2 });
    expect(cardOf(result.current, CoverageKind.Applications)).toMatchObject({ total: 2, covered: 1, uncovered: 1 });
    expect(cardOf(result.current, CoverageKind.Toolsets)).toMatchObject({ total: 1, covered: 1, uncovered: 0 });
    expect(cardOf(result.current, CoverageKind.Evaluatees)).toMatchObject({ total: 6, covered: 3, uncovered: 3 });
  });

  test('reads the deployments with one unfiltered listing request', async () => {
    mockListing();
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());
    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Ready)).toBe(true));

    expect(getDeployments).toHaveBeenCalledOnce();
    expect(getDeployments).toHaveBeenCalledWith();
  });

  test('queries runs started within the last 30 days of the current time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    mockListing();
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());
    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Ready)).toBe(true));

    expect(executeStructuredQuery).toHaveBeenCalledWith(buildCoverageQuery(NOW - THIRTY_DAYS_MS));
  });

  test('errors every card when the deployment listing fails', async () => {
    mockListing({ success: false });
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());

    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Error)).toBe(true));
  });

  test('errors every card when the deployment listing throws instead of leaving them loading', async () => {
    vi.mocked(getDeployments).mockRejectedValue(new Error('boom'));
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());

    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Error)).toBe(true));
  });

  test('errors every card when the coverage query returns null', async () => {
    mockListing();
    vi.mocked(executeStructuredQuery).mockResolvedValue(null);

    const { result } = renderHook(() => useCoverageData());

    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Error)).toBe(true));
  });

  test('errors every card when the coverage query throws', async () => {
    mockListing();
    vi.mocked(executeStructuredQuery).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCoverageData());

    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Error)).toBe(true));
  });

  test('reads a successful listing with no body as an empty one', async () => {
    mockListing({ success: true });
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());

    await waitFor(() => expect(isEveryCard(result.current, CoverageStatus.Ready)).toBe(true));
    expect(cardOf(result.current, CoverageKind.Evaluatees)).toMatchObject({ total: 0, rate: null });
  });

  test('loads again with a fresh window when the day rolls over while the page is open', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 30, 23, 59, 0));
    mockListing();
    mockCoverage();

    const { result } = renderHook(() => useCoverageData());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(getDeployments).toHaveBeenCalledOnce();
    expect(isEveryCard(result.current, CoverageStatus.Ready)).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });

    expect(getDeployments).toHaveBeenCalledTimes(2);
    expect(executeStructuredQuery).toHaveBeenLastCalledWith(buildCoverageQuery(Date.now() - THIRTY_DAYS_MS));
    expect(isEveryCard(result.current, CoverageStatus.Ready)).toBe(true);
  });
});
