import { act, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import SessionDetailBody from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailBody';
import { useSessionTraces } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-traces';
import { SESSIONS_SEARCH_DEBOUNCE_MS } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { SessionDetailRow, SessionScope } from '@/src/models/analytics/sessions-trace';
import { defaultSessionsSource } from '@/src/utils/analytics/sessions-source';

vi.mock('@/src/components/Analytics/SessionsTrace/Detail/use-session-traces');

vi.mock('@/src/components/Analytics/SessionsTrace/Detail/SessionTraceList', () => ({
  default: ({ headerAction, emptyState }: { headerAction?: ReactNode; emptyState?: ReactNode }) => (
    <section aria-label="trace list">
      {headerAction}
      {emptyState}
    </section>
  ),
}));

vi.mock('@/src/components/Analytics/SessionsTrace/Detail/SessionDetailRail', () => ({
  default: () => null,
}));

const SESSION = {
  project_id: 'demo-project',
  first_request_time: 1000,
  last_request_time: 2000,
} as unknown as SessionDetailRow;

const SCOPE: SessionScope = { id: 'chat-1', source: 'chat_id' };

const traces = (overrides: Partial<ReturnType<typeof useSessionTraces>> = {}): ReturnType<typeof useSessionTraces> => ({
  groups: [],
  hasMore: false,
  isLoading: false,
  hasLoadError: false,
  isSearch: false,
  onLoadMore: vi.fn(),
  ...overrides,
});

const renderBody = () =>
  render(
    <SessionDetailBody
      session={SESSION}
      source={defaultSessionsSource()}
      enrichmentPanels={[]}
      enrichmentProvenance={{}}
      metadataGroups={[]}
      scope={SCOPE}
      feedback={null}
      onOpenTrace={vi.fn()}
    />,
  );

const searchField = () => screen.getByRole('textbox');

const expectListingVisible = () => {
  expect(screen.getByRole('region', { name: 'trace list' })).toBeTruthy();
  expect(screen.queryByText(SessionsTraceI18nKey.TraceSearchNoMatch)).toBeNull();
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(useSessionTraces).mockReturnValue(traces());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionDetailBody', () => {
  test('applies the trimmed search value once typing settles', async () => {
    renderBody();

    fireEvent.change(searchField(), { target: { value: '  tr-1  ' } });
    expect(vi.mocked(useSessionTraces)).toHaveBeenLastCalledWith(expect.objectContaining({ traceId: undefined }));

    await act(async () => vi.advanceTimersByTimeAsync(SESSIONS_SEARCH_DEBOUNCE_MS));

    expect(vi.mocked(useSessionTraces)).toHaveBeenLastCalledWith(expect.objectContaining({ traceId: 'tr-1' }));
  });

  test('keeps the listing while the typed value waits for the debounce', () => {
    renderBody();

    fireEvent.change(searchField(), { target: { value: 'tr-1' } });

    expect(vi.mocked(useSessionTraces)).toHaveBeenLastCalledWith(expect.objectContaining({ traceId: undefined }));
    expectListingVisible();
  });

  test('applies no search for a whitespace-only value', async () => {
    renderBody();

    fireEvent.change(searchField(), { target: { value: '   ' } });
    await act(async () => vi.advanceTimersByTimeAsync(SESSIONS_SEARCH_DEBOUNCE_MS));

    expect(vi.mocked(useSessionTraces)).toHaveBeenLastCalledWith(expect.objectContaining({ traceId: undefined }));
  });

  test('states that no trace has the searched id when the search returns nothing', () => {
    vi.mocked(useSessionTraces).mockReturnValue(traces({ isSearch: true }));

    renderBody();

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(SessionsTraceI18nKey.TraceSearchNoMatch)).toBeTruthy();
    expect(searchField()).toBeTruthy();
  });

  test('keeps the listing for a session with no traces when nothing is searched', () => {
    renderBody();

    expectListingVisible();
  });
});
