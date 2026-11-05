import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { listIngestFailures, retryIngestFailures } from '@/src/app/[lang]/tables/actions';
import { ingestFailure, ingestList, SWEEP } from '@/src/components/Analytics/Tables/IngestFailures/tests/mock';
import { useIngestFailures } from '@/src/components/Analytics/Tables/IngestFailures/use-ingest-failures';
import { useIngestFailuresCount } from '@/src/components/Analytics/Tables/IngestFailures/use-ingest-failures-count';
import { useRetryIngestFailures } from '@/src/components/Analytics/Tables/IngestFailures/use-retry-ingest-failures';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { IngestFailureKind, IngestFailureReason, IngestFailureState } from '@/src/models/analytics/ingest-failure';

vi.mock('@/src/app/[lang]/tables/actions');

const group = {
  key: 'mapping_error:blob',
  reason: IngestFailureReason.MappingError,
  kind: IngestFailureKind.Blob,
  failures: [ingestFailure()],
  newestAt: '2026-11-04T09:00:00Z',
};

describe('useIngestFailures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads both states with the run filter and takes counts from the service', async () => {
    vi.mocked(listIngestFailures).mockImplementation(async ({ state }) => ({
      success: true,
      response: ingestList(state === IngestFailureState.Parked ? [ingestFailure()] : [], {
        by_state: { parked: 1500, pending: 7 },
      }),
    }));

    const { result } = renderHook(() => useIngestFailures('run-1'));

    await waitFor(() => expect(result.current.hasAnswered).toBe(true));
    expect(result.current.byState).toEqual({ parked: 1500, pending: 7 });
    expect(result.current.parked).toHaveLength(1);
    expect(listIngestFailures).toHaveBeenCalledWith({
      state: IngestFailureState.Parked,
      backfill_run_id: 'run-1',
      limit: 1000,
    });
    expect(listIngestFailures).toHaveBeenCalledWith({
      state: IngestFailureState.Pending,
      backfill_run_id: 'run-1',
      limit: 1000,
    });
  });

  test('reads a 404 as unavailable without a notification', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: false, status: 404 });

    const { result } = renderHook(() => useIngestFailures());

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(useNotification().showNotification).not.toHaveBeenCalled();
  });

  test('reports a failed read with a notification', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: false, status: 500, errorMessage: 'down' });

    const { result } = renderHook(() => useIngestFailures());

    await waitFor(() => expect(result.current.hasFailed).toBe(true));
    expect(useNotification().showNotification).toHaveBeenCalledOnce();
  });
});

describe('useIngestFailuresCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads the parked total with one row', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: true, response: ingestList([], { total: 1500 }) });

    const { result } = renderHook(() => useIngestFailuresCount(true));

    await waitFor(() => expect(result.current.parked).toBe(1500));
    expect(listIngestFailures).toHaveBeenCalledWith({ state: IngestFailureState.Parked, limit: 1 });
  });

  test('asks nothing when not asked to', async () => {
    const { result } = renderHook(() => useIngestFailuresCount(false));

    await act(async () => {});
    expect(result.current.parked).toBeUndefined();
    expect(listIngestFailures).not.toHaveBeenCalled();
  });

  test('reads a 404 as unavailable', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: false, status: 404 });

    const { result } = renderHook(() => useIngestFailuresCount(true));

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
  });
});

describe('useRetryIngestFailures', () => {
  const onRetried = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onRetried.mockResolvedValue(undefined);
  });

  const renderRetry = (backfillRunId?: string) =>
    renderHook(() => useRetryIngestFailures({ backfillRunId, onRetried }));

  test('sends targets that mix kinds on one key and states the next pass', async () => {
    vi.mocked(retryIngestFailures).mockResolvedValue({ success: true, response: { requeued: 2, retry_sweep: SWEEP } });
    const { result } = renderRetry();
    const targets = [
      { kind: IngestFailureKind.Blob, subject: 'k' },
      { kind: IngestFailureKind.Records, subject: 'k' },
    ];

    await act(() => result.current.retryTargets(targets));

    expect(retryIngestFailures).toHaveBeenCalledWith({ targets });
    expect(result.current.outcome).toContain(IngestFailuresI18nKey.Queued);
    expect(result.current.outcome).toContain(IngestFailuresI18nKey.NoteNextPass);
    expect(onRetried).toHaveBeenCalledOnce();
  });

  test('sends a group retry with its filters and the run', async () => {
    vi.mocked(retryIngestFailures).mockResolvedValue({ success: true, response: { requeued: 1, retry_sweep: SWEEP } });
    const { result } = renderRetry('run-1');

    await act(() => result.current.retryGroup(group));

    expect(retryIngestFailures).toHaveBeenCalledWith({
      state: IngestFailureState.Parked,
      reason: IngestFailureReason.MappingError,
      kind: IngestFailureKind.Blob,
      backfill_run_id: 'run-1',
    });
  });

  test('states several passes and a switched-off pass', async () => {
    vi.mocked(retryIngestFailures).mockResolvedValueOnce({
      success: true,
      response: { requeued: 600, retry_sweep: SWEEP },
    });
    const { result } = renderRetry();

    await act(() => result.current.retryTargets([{ kind: IngestFailureKind.Day, subject: '2026-11-03' }]));
    expect(result.current.outcome).toContain(IngestFailuresI18nKey.NoteSeveralPasses);

    vi.mocked(retryIngestFailures).mockResolvedValueOnce({
      success: true,
      response: { requeued: 1, retry_sweep: { enabled: false, max_per_sweep: 500 } },
    });
    await act(() => result.current.retryTargets([{ kind: IngestFailureKind.Day, subject: '2026-11-03' }]));
    expect(result.current.outcome).toContain(IngestFailuresI18nKey.NoteSweepOff);
  });

  test('says nothing was left to queue at zero', async () => {
    vi.mocked(retryIngestFailures).mockResolvedValue({ success: true, response: { requeued: 0, retry_sweep: SWEEP } });
    const { result } = renderRetry();

    await act(() => result.current.retryTargets([{ kind: IngestFailureKind.Day, subject: '2026-11-03' }]));

    expect(result.current.outcome).toBe(IngestFailuresI18nKey.NothingToQueue);
  });

  test('reports a refusal by notification and still reads again', async () => {
    vi.mocked(retryIngestFailures).mockResolvedValue({ success: false, status: 403, errorMessage: 'no' });
    const { result } = renderRetry();

    await act(() => result.current.retryGroup(group));

    expect(useNotification().showNotification).toHaveBeenCalledOnce();
    expect(result.current.outcome).toBe('');
    expect(onRetried).toHaveBeenCalledOnce();
  });

  test('reads the group count with the group filters and the run', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: true, response: ingestList([], { total: 1200 }) });
    const { result } = renderRetry('run-1');

    expect(await result.current.readGroupCount(group)).toBe(1200);
    expect(listIngestFailures).toHaveBeenCalledWith({
      state: IngestFailureState.Parked,
      reason: IngestFailureReason.MappingError,
      kind: IngestFailureKind.Blob,
      backfill_run_id: 'run-1',
      limit: 1,
    });
  });

  test('answers no count when the count read fails', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: false, status: 500 });
    const { result } = renderRetry();

    expect(await result.current.readGroupCount(group)).toBeNull();
  });
});
