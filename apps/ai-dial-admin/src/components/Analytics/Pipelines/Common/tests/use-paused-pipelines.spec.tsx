import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPausedPipelines, getRunnerPipelines } from '@/src/app/[lang]/pipelines/actions';
import { runtimeStatusOf, usePausedPipelines } from '@/src/components/Analytics/Pipelines/Common/use-paused-pipelines';
import { useAppContext } from '@/src/context/AppContext';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { PauseOrigin, PipelineRuntimeStatus } from '@/src/models/analytics/pipeline-runtime';

vi.mock('@/src/app/[lang]/pipelines/actions');

// The shared mock returns one frozen context value; this hook's whole point is what it does on either
// side of the full-admin line, so the context is re-mocked here as a spy.
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: {}, isFullAdmin: true })),
}));

const read = vi.mocked(getPausedPipelines);
const readCache = vi.mocked(getRunnerPipelines);

const tracked = (...pipelineNames: string[]) =>
  readCache.mockResolvedValue({
    success: true,
    response: pipelineNames.map((name) => ({ name, enabled: true, generation: 1 })),
  });

const asFullAdmin = (isFullAdmin: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({ featureFlags: {}, isFullAdmin } as never);

const PAUSE = { pipelineName: 'usage-live', origin: PauseOrigin.Operator, since: '2026-09-21T15:00:00Z' };

describe('usePausedPipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asFullAdmin(true);
    tracked('usage-live');
  });

  test('exposes the paused pipelines by name once the runner answers', async () => {
    read.mockResolvedValue({ success: true, response: [PAUSE] });

    const { result } = renderHook(() => usePausedPipelines());

    await waitFor(() => expect(result.current.isRead).toBe(true));
    expect(result.current.paused['usage-live']).toEqual(PAUSE);
    expect(result.current.tracked.has('usage-live')).toBe(true);
  });

  // The runner authorizes its reads on full-admin rights, so a request from anyone else is one the
  // service would refuse — and a 403 in the log of every read-only admin who opens a pipeline.
  test('issues no request for a caller who is not a full admin', async () => {
    asFullAdmin(false);

    const { result } = renderHook(() => usePausedPipelines());

    await waitFor(() => expect(read).not.toHaveBeenCalled());
    expect(result.current.isRead).toBe(false);
  });

  // The two reads fail independently: a runner that does not serve the cache listing must still let an
  // operator pause, which withholding everything on one failure took away.
  test('keeps the pauses when the cache listing could not be read', async () => {
    read.mockResolvedValue({ success: true, response: [PAUSE] });
    readCache.mockResolvedValue({ success: false });

    const { result } = renderHook(() => usePausedPipelines());

    await waitFor(() => expect(result.current.isRead).toBe(true));
    expect(result.current.isTrackingRead).toBe(false);
    expect(result.current.paused['usage-live']).toEqual(PAUSE);
  });

  // Without the cache there is no way to tell a firing pipeline from one nothing took on, so the
  // console keeps the state it can act on rather than withholding the pause on a guess.
  test('states running rather than not-tracked while the cache is unread', () => {
    const unread = { isRead: true, isTrackingRead: false, paused: {}, tracked: new Set<string>() };

    expect(runtimeStatusOf(unread, 'usage-live', true, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Running);
  });

  test('reports a refused read as not read rather than as nothing paused', async () => {
    read.mockResolvedValue({ success: false, errorHeader: 'postgres_unavailable' });

    const { result } = renderHook(() => usePausedPipelines());

    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(result.current.isRead).toBe(false);
    expect(result.current.paused).toEqual({});
  });

  test('reload asks the runner again', async () => {
    read.mockResolvedValue({ success: true, response: [] });
    tracked('usage-live');

    const { result } = renderHook(() => usePausedPipelines());

    await waitFor(() => expect(result.current.isRead).toBe(true));
    read.mockResolvedValue({ success: true, response: [PAUSE] });
    await result.current.reload();

    await waitFor(() => expect(result.current.paused['usage-live']).toEqual(PAUSE));
    expect(read).toHaveBeenCalledTimes(2);
  });

  // The case the registry cannot show: enabled, the runner's to drive, and nothing driving it.
  test('calls an enrichment pipeline the runner did not take on not-tracked', () => {
    const read = { isRead: true, isTrackingRead: true, paused: {}, tracked: new Set(['other']) };

    expect(runtimeStatusOf(read, 'usage-live', true, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.NotTracked);
    expect(runtimeStatusOf(read, 'other', true, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Running);
    expect(runtimeStatusOf(read, 'other', false, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Unknown);
    const unread = { isRead: false, isTrackingRead: false, paused: {}, tracked: new Set<string>() };
    expect(runtimeStatusOf(unread, 'other', true, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Unknown);
  });

  // ADAS runs aggregate pipelines on its own scheduler, so the runner's cache says nothing about them —
  // reading their absence as a fault flagged every healthy rollup as "nothing is running this pipeline".
  test('states nothing about an aggregate pipeline, which the runner does not drive', () => {
    const read = { isRead: true, isTrackingRead: true, paused: {}, tracked: new Set<string>() };

    expect(runtimeStatusOf(read, 'sessions-rollup', true, PipelineKind.Aggregate)).toBe(PipelineRuntimeStatus.Unknown);
  });
});
