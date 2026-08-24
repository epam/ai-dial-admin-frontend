import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getConversationHopBodies } from '@/src/app/[lang]/conversations-trace/actions';
import { useHopBodies } from '@/src/components/Analytics/ConversationsTrace/Detail/use-hop-bodies';
import { ConversationSpanRow, HopTextSuppression, HopTextsState } from '@/src/models/analytics/conversations-trace';

vi.mock('@/src/app/[lang]/conversations-trace/actions');

const CHAT_ID = 'chat-1';
const TRACE_ID = 'tr1';

const span = (coreSpanId: string, overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow =>
  ({
    core_span_id: coreSpanId,
    request_time: 1787052797216,
    response_body_bytes: 4096,
    ...overrides,
  }) as ConversationSpanRow;

const texts = (sent: string) => ({
  success: true,
  response: { state: HopTextsState.Available, sent, received: 'answer', toolCalls: [] },
});

const action = () => getConversationHopBodies as unknown as ReturnType<typeof vi.fn>;

describe('useHopBodies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads nothing while no hop is open', () => {
    const { result } = renderHook(() => useHopBodies(CHAT_ID, TRACE_ID, null));

    expect(action()).not.toHaveBeenCalled();
    expect(result.current.bodies).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('reads the open hop, naming it and its own instant', async () => {
    action().mockResolvedValue(texts('the prompt'));
    const { result } = renderHook(() => useHopBodies(CHAT_ID, TRACE_ID, span('sp1')));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(action()).toHaveBeenCalledWith(CHAT_ID, TRACE_ID, 'sp1', 1787052797216);
    expect(result.current.bodies?.sent).toBe('the prompt');
  });

  // One hop at a time: opening a chain must never read the hops the reader did not open.
  test('reads once per hop opened', async () => {
    action().mockResolvedValue(texts('one'));
    const { result, rerender } = renderHook(({ id }) => useHopBodies(CHAT_ID, TRACE_ID, span(id)), {
      initialProps: { id: 'sp1' },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ id: 'sp2' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(action()).toHaveBeenCalledTimes(2);
  });

  // Returning to the hop just left re-reads nothing — a hop's body reaches 4 MiB.
  test('holds the open hop answer, so a re-render reads nothing more', async () => {
    action().mockResolvedValue(texts('held'));
    const { result, rerender } = renderHook(() => useHopBodies(CHAT_ID, TRACE_ID, span('sp1')));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender();
    rerender();

    expect(action()).toHaveBeenCalledOnce();
    expect(result.current.bodies?.sent).toBe('held');
  });

  // An earlier hop's texts must never land under a later hop's heading.
  test('discards an answer for a hop that is no longer open', async () => {
    action()
      .mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve(texts('slow first')), 40)))
      .mockResolvedValue(texts('second'));

    const { result, rerender } = renderHook(({ id }) => useHopBodies(CHAT_ID, TRACE_ID, span(id)), {
      initialProps: { id: 'sp1' },
    });
    rerender({ id: 'sp2' });

    await waitFor(() => expect(result.current.bodies?.sent).toBe('second'));
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(result.current.bodies?.sent).toBe('second');
  });

  // One panel of a hop detail: a read that throws must leave the rest of the detail standing and say so,
  // rather than becoming an unhandled rejection.
  test('reports a failure when the read throws', async () => {
    action().mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useHopBodies(CHAT_ID, TRACE_ID, span('sp1')));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bodies?.state).toBe(HopTextsState.LoadFailed);
  });

  test('reports a failure the action could not answer at all', async () => {
    action().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHopBodies(CHAT_ID, TRACE_ID, span('sp1')));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bodies?.state).toBe(HopTextsState.LoadFailed);
  });

  test('clears the held answer when the hop is closed', async () => {
    action().mockResolvedValue(texts('open'));
    const { result, rerender } = renderHook(({ open }) => useHopBodies(CHAT_ID, TRACE_ID, open ? span('sp1') : null), {
      initialProps: { open: true },
    });

    await waitFor(() => expect(result.current.bodies?.sent).toBe('open'));
    rerender({ open: false });

    expect(result.current.bodies).toBeNull();
  });

  // The verdict is computable from the hop row, so a hop with nothing worth reading costs no request at all.
  // On the sampled 384-hop turn that is 284 of them.
  test.each([
    ['a hop that returned nothing', { response_body_bytes: 0 }, HopTextSuppression.NoResponse],
    ['a session-setup hop', { event_kind: 'mcp', mcp_method: 'tools/list' }, HopTextSuppression.SessionSetup],
    ['an embedding', { event_kind: 'embedding' }, HopTextSuppression.Embedding],
  ])('reads nothing for %s, and states why', (_name, overrides, expected) => {
    const { result } = renderHook(() => useHopBodies(CHAT_ID, TRACE_ID, span('sp1', overrides)));

    expect(action()).not.toHaveBeenCalled();
    expect(result.current.suppression).toBe(expected);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.bodies).toBeNull();
  });

  // A deny-list: an unrecognised method is read rather than silently hidden.
  test('reads a hop whose method this frontend does not recognise', async () => {
    action().mockResolvedValue(texts('unknown but shown'));
    const { result } = renderHook(() =>
      useHopBodies(CHAT_ID, TRACE_ID, span('sp1', { event_kind: 'mcp', mcp_method: 'resources/subscribe' })),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.suppression).toBeNull();
    expect(result.current.bodies?.sent).toBe('unknown but shown');
  });

  // Moving from a readable hop to a suppressed one must drop the readable one's text, not leave it standing.
  test('clears the held answer when the reader moves to a suppressed hop', async () => {
    action().mockResolvedValue(texts('readable'));
    const { result, rerender } = renderHook(
      ({ bytes }) => useHopBodies(CHAT_ID, TRACE_ID, span('sp1', { response_body_bytes: bytes })),
      {
        initialProps: { bytes: 4096 },
      },
    );

    await waitFor(() => expect(result.current.bodies?.sent).toBe('readable'));
    rerender({ bytes: 0 });

    expect(result.current.bodies).toBeNull();
    expect(result.current.suppression).toBe(HopTextSuppression.NoResponse);
  });
});
