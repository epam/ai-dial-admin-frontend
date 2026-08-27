import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createSavedQuery, updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import DuplicateQuery from '@/src/components/Analytics/Queries/Modals/DuplicateQuery';
import { useAppContext } from '@/src/context/AppContext';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryRequest, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const mockShowNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ isFullAdmin: false })),
}));

const setFullAdmin = (isFullAdmin: boolean) => vi.mocked(useAppContext).mockReturnValue({ isFullAdmin } as never);

const STRUCTURED: SavedQuery = {
  id: 'sq_1',
  name: 'Top chats',
  description: 'For the Monday review',
  tag: 'Adoption',
  scope: SavedQueryScope.Personal,
  source: 'dial_usage_log',
  query: { entity: 'dial_usage_log', mode: QueryMode.Aggregate },
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  result_view: QueryResultView.Chart,
  chart: { type: ChartType.Bar, x_field: 'project', y_field: 'count' },
  generation: 3,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
};

const COMMON: SavedQuery = { ...STRUCTURED, id: 'sq_2', name: 'Shared', scope: SavedQueryScope.Common };

const CREATED: SavedQuery = { ...STRUCTURED, id: 'sq_new', name: 'Top chats (copy)' };

const onClose = vi.fn();

const renderModal = (query: SavedQuery = STRUCTURED) => render(<DuplicateQuery query={query} onClose={onClose} />);

const sentRequest = () => vi.mocked(createSavedQuery).mock.calls[0][0] as SavedQueryRequest;

const setName = (name: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: /EntityFields.displayName/ }), { target: { value: name } });
};

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Buttons.Duplicate' }));
};

describe('DuplicateQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setFullAdmin(false);
    vi.mocked(createSavedQuery).mockResolvedValue({ success: true, response: CREATED });
  });

  test('seeds the form from the source query', () => {
    renderModal();

    expect(screen.getByDisplayValue('For the Monday review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Adoption')).toBeInTheDocument();
  });

  test('pre-fills the name with a copy suffix, so an unedited submit is distinguishable', () => {
    renderModal();

    expect(screen.getByDisplayValue('Top chats (copy)')).toBeInTheDocument();
  });

  test('suffixes a source whose name already reads as a copy, so the two stay distinguishable', () => {
    renderModal({ ...STRUCTURED, name: 'Top chats (copy)' });

    expect(screen.getByDisplayValue('Top chats (copy) (copy)')).toBeInTheDocument();
  });

  test('suffixes a prose name that merely contains the word copy', () => {
    renderModal({ ...STRUCTURED, name: 'chat copywriting stats' });

    expect(screen.getByDisplayValue('chat copywriting stats (copy)')).toBeInTheDocument();
  });

  test('blocks submission when the name is cleared', () => {
    renderModal();

    setName('  ');

    expect(screen.getByRole('button', { name: 'Buttons.Duplicate' })).toBeDisabled();
  });

  test('accepts a name another query already uses, since the service enforces no uniqueness', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Shared');
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().name).toBe('Shared');
  });

  test('carries the source body, time intent, result view, and chart across unchanged', async () => {
    const user = userEvent.setup();
    renderModal();

    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.query).toEqual(STRUCTURED.query);
    expect(request.time).toEqual(STRUCTURED.time);
    expect(request.chart).toEqual(STRUCTURED.chart);
    expect(request.result_view).toBe(QueryResultView.Chart);
  });

  test('carries a SQL body across instead of a structured one', async () => {
    const user = userEvent.setup();
    renderModal({ ...STRUCTURED, query: void 0, sql: 'SELECT count(*) FROM dial_usage_log' });

    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.sql).toBe('SELECT count(*) FROM dial_usage_log');
    expect('query' in request).toBeFalsy();
  });

  test('sends the metadata entered in the modal', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Weekly adoption');
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.name).toBe('Weekly adoption');
    expect(request.description).toBe('For the Monday review');
    expect(request.tag).toBe('Adoption');
  });

  test('sends no server-assigned member', async () => {
    const user = userEvent.setup();
    renderModal();

    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    ['id', 'owner_id', 'owner_email', 'source', 'generation', 'created_at', 'updated_at'].forEach((member) => {
      expect(member in request).toBeFalsy();
    });
  });

  test('creates a new query rather than replacing the source', async () => {
    const user = userEvent.setup();
    renderModal();

    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(updateSavedQuery).not.toHaveBeenCalled();
  });

  test('navigates to the created copy, not the source', async () => {
    const user = userEvent.setup();
    renderModal();

    await submit(user);

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sq_new'));
    expect(onClose).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalled();
  });

  test('keeps the modal open and reports the failure guidance when the create fails', async () => {
    const user = userEvent.setup();
    vi.mocked(createSavedQuery).mockResolvedValue({
      success: false,
      errorHeader: 'forbidden',
      errorMessage: 'common writes require FULL_ADMIN',
      requestId: 'trace-2',
    });
    renderModal();

    await submit(user);

    await waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Queries.ErrorForbidden' }),
    );
  });

  test('surfaces the service message when the stored body is no longer accepted', async () => {
    const user = userEvent.setup();
    vi.mocked(createSavedQuery).mockResolvedValue({
      success: false,
      errorHeader: 'validation_error',
      errorMessage: "unknown column 'project_id'",
      requestId: 'trace-3',
    });
    renderModal();

    await submit(user);

    await waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ description: "unknown column 'project_id'" }),
    );
  });

  test('offers no scope control to a caller who is not a full administrator', () => {
    renderModal(COMMON);

    expect(screen.queryByText('Queries.Scope')).not.toBeInTheDocument();
  });

  test('copies a common query into the personal scope for a caller who cannot write common', async () => {
    const user = userEvent.setup();
    renderModal(COMMON);

    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().scope).toBe(SavedQueryScope.Personal);
  });

  test("seeds an administrator's copy with the source query's own scope", () => {
    setFullAdmin(true);
    renderModal(COMMON);

    expect(screen.getByText('Queries.Scope')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Queries.ScopeCommon/ })).toBeChecked();
  });

  test('lets an administrator move the copy to another scope', async () => {
    const user = userEvent.setup();
    setFullAdmin(true);
    renderModal(COMMON);

    await user.click(screen.getByRole('radio', { name: /Queries.ScopePersonal/ }));
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().scope).toBe(SavedQueryScope.Personal);
  });
});
