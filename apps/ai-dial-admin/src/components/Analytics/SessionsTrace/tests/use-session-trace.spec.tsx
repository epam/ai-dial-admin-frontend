import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSessionTrace } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-trace';
import { SessionTraceFigures } from '@/src/models/analytics/sessions-trace';

const getSessionSpans = vi.fn();

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getSessionSpans: (...args: unknown[]) => getSessionSpans(...args),
}));

const FIGURES = { traceId: 't1' } as SessionTraceFigures;

// An entry hop, a call beneath it, and a call beneath that — the depth an entity's own call usually sits at.
const SPANS = [
  { core_span_id: 'root', core_parent_span_id: null, request_time: 1 },
  { core_span_id: 'app', core_parent_span_id: 'root', request_time: 2 },
  { core_span_id: 'model', core_parent_span_id: 'app', request_time: 3 },
];

const openTrace = async (initialSpanId?: string) => {
  const { result } = renderHook(() => useSessionTrace());

  await act(() => result.current.onOpenTrace(FIGURES, undefined, initialSpanId));

  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  getSessionSpans.mockResolvedValue({ success: true, response: { spans: SPANS, fieldGroups: [] } });
});

describe('useSessionTrace', () => {
  test('opens on the entry hop when no span is named', async () => {
    const result = await openTrace();

    expect(result.current.selectedSpanId).toBe('root');
  });

  test('opens on the named span when the read returned it', async () => {
    const result = await openTrace('model');

    expect(result.current.selectedSpanId).toBe('model');
  });

  test('falls back to the entry hop when the named span is not in the read', async () => {
    const result = await openTrace('elsewhere');

    expect(result.current.selectedSpanId).toBe('root');
  });
});
