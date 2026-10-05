import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPipelineRuntimeView } from '@/src/app/[lang]/pipelines/actions';
import { runtimeView } from '@/src/components/Analytics/Pipelines/Common/tests/mock';
import { usePipelineRuntimeView } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-runtime-view';
import { useAppContext } from '@/src/context/AppContext';
import {
  RUNNER_CACHE_COLD,
  RUNNER_NOT_CONFIGURED,
  RUNNER_PIPELINE_NOT_FOUND,
  RuntimeReadOutcome,
} from '@/src/models/analytics/pipeline-runtime';

vi.mock('@/src/app/[lang]/pipelines/actions');

// The shared mock returns one frozen context value; this hook's whole point is what it does on either
// side of the full-admin line, so the context is re-mocked here as a spy.
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: {}, isFullAdmin: true })),
}));

const read = vi.mocked(getPipelineRuntimeView);

const asFullAdmin = (isFullAdmin: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({ featureFlags: {}, isFullAdmin } as never);

const renderRead = (isAsked = true) => renderHook(() => usePipelineRuntimeView('feedback-live', isAsked));

describe('usePipelineRuntimeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asFullAdmin(true);
  });

  test('exposes the view once the runner answers', async () => {
    const view = runtimeView();
    read.mockResolvedValue({ success: true, response: view });

    const { result } = renderRead();

    await waitFor(() => expect(result.current.outcome).toBe(RuntimeReadOutcome.Read));
    expect(result.current.view).toEqual(view);
    expect(read).toHaveBeenCalledWith('feedback-live');
  });

  // Nothing is stated until something is known: a verdict published before the runner has answered is
  // wrong however it is worded, and "no runner at all" used to be the hook's opening claim.
  test('states nothing before the first answer lands', () => {
    read.mockReturnValue(new Promise(() => undefined));

    const { result } = renderRead();

    expect(result.current.outcome).toBe(RuntimeReadOutcome.Pending);
    expect(result.current.view).toBeUndefined();
  });

  // Each of these calls for different words on screen, so each has to arrive as its own outcome.
  test("tells the service's four answers apart", async () => {
    const cases: [string | undefined, RuntimeReadOutcome][] = [
      [RUNNER_NOT_CONFIGURED, RuntimeReadOutcome.Unavailable],
      [RUNNER_CACHE_COLD, RuntimeReadOutcome.Cold],
      [RUNNER_PIPELINE_NOT_FOUND, RuntimeReadOutcome.NotHeld],
      ['runtime_store_down', RuntimeReadOutcome.Failed],
    ];

    for (const [errorHeader, expected] of cases) {
      vi.clearAllMocks();
      read.mockResolvedValue({ success: false, errorHeader });

      const { result } = renderRead();

      await waitFor(() => expect(result.current.outcome).toBe(expected));
    }
  });

  test('carries the service message and trace of a refusal', async () => {
    read.mockResolvedValue({
      success: false,
      errorHeader: 'runtime_store_down',
      errorMessage: 'store is down',
      requestId: 'trace-1',
    });

    const { result } = renderRead();

    await waitFor(() => expect(result.current.outcome).toBe(RuntimeReadOutcome.Failed));
    expect(result.current.errorMessage).toBe('store is down');
    // Without it a reported failure cannot be found in the service's own log.
    expect(result.current.requestId).toBe('trace-1');
  });

  // A transport failure rejects rather than resolving, and an unhandled rejection in a hook takes the
  // page down with it.
  test('answers a rejected read as a failed one', async () => {
    read.mockRejectedValue(new Error('network'));

    const { result } = renderRead();

    await waitFor(() => expect(result.current.outcome).toBe(RuntimeReadOutcome.Failed));
  });

  test('issues no request for a caller who is not a full admin', async () => {
    asFullAdmin(false);

    const { result } = renderRead();

    await waitFor(() => expect(result.current.outcome).toBe(RuntimeReadOutcome.Unavailable));
    expect(read).not.toHaveBeenCalled();
  });

  // An aggregate pipeline and a deployment with analytics off both arrive as `isAsked` false: the
  // runner has no answer for either, and a 404 for the first would read as a pipeline it refused.
  test('issues no request for a pipeline its caller does not ask about', async () => {
    const { result } = renderRead(false);

    await waitFor(() => expect(result.current.outcome).toBe(RuntimeReadOutcome.Unavailable));
    expect(read).not.toHaveBeenCalled();
  });

  test('reads again on demand', async () => {
    read.mockResolvedValue({ success: true, response: runtimeView() });

    const { result } = renderRead();

    await waitFor(() => expect(read).toHaveBeenCalledOnce());
    await act(async () => {
      await result.current.reload();
    });

    expect(read).toHaveBeenCalledTimes(2);
  });

  // A Read-again and the re-read a resume triggers land in whichever order the service answers; the
  // loser would leave the page stating the answer from before the pipeline changed. The stale update
  // is flushed inside `act` before the assertion, so the test fails if the guard is removed — asserting
  // straight after the await read the render from before the stale answer and passed either way.
  test('discards an answer that lands after a newer one', async () => {
    const fresh = runtimeView({ generation: 9 });

    read.mockResolvedValue({ success: true, response: fresh });

    const { result } = renderRead();

    await waitFor(() => expect(result.current.view?.generation).toBe(9));

    let releaseStale: (() => void) | undefined;
    read.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseStale = () => resolve({ success: true, response: runtimeView({ generation: 1 }) });
        }),
    );

    await act(async () => {
      const slow = result.current.reload();
      await result.current.reload();
      releaseStale?.();
      await slow;
    });

    expect(result.current.view?.generation).toBe(9);
  });

  // The detail frame is reused across a client-side navigation between two pipelines, so an answer
  // left standing would be the previous pipeline's — and its Resume would act on the new one.
  test("drops the previous pipeline's answer when the name changes", async () => {
    read.mockResolvedValue({ success: true, response: runtimeView() });

    const { result, rerender } = renderHook(({ name }) => usePipelineRuntimeView(name, true), {
      initialProps: { name: 'feedback-live' },
    });

    await waitFor(() => expect(result.current.outcome).toBe(RuntimeReadOutcome.Read));

    read.mockReturnValue(new Promise(() => undefined));
    rerender({ name: 'usage-live' });

    expect(result.current.outcome).toBe(RuntimeReadOutcome.Pending);
    expect(result.current.view).toBeUndefined();
  });

  // A read issued while the caller still had the rights must not land afterwards and put the runner's
  // answer back on a page that may no longer ask for it.
  test('discards a read in flight when the caller loses the right to ask', async () => {
    let release: (() => void) | undefined;
    read.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ success: true, response: runtimeView() });
      }),
    );

    const { result, rerender } = renderHook(({ isAsked }) => usePipelineRuntimeView('feedback-live', isAsked), {
      initialProps: { isAsked: true },
    });

    asFullAdmin(false);
    rerender({ isAsked: true });

    await act(async () => {
      release?.();
    });

    expect(result.current.outcome).toBe(RuntimeReadOutcome.Unavailable);
    expect(result.current.view).toBeUndefined();
  });
});
