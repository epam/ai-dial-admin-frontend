import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import EditQuery from '@/src/components/Analytics/Queries/Modals/EditQuery';
import { useAppContext } from '@/src/context/AppContext';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryRequest, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

const onClose = vi.fn();

const renderModal = (query: SavedQuery = STRUCTURED) => render(<EditQuery query={query} onClose={onClose} />);

const sentRequest = () => vi.mocked(updateSavedQuery).mock.calls[0][1] as SavedQueryRequest;

const setName = (name: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: /EntityFields.displayName/ }), { target: { value: name } });
};

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Buttons.Save' }));
};

describe('EditQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setFullAdmin(false);
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: true, response: { ...STRUCTURED, name: 'Renamed' } });
  });

  test('seeds the form from the stored query', () => {
    renderModal();

    expect(screen.getByDisplayValue('Top chats')).toBeInTheDocument();
    expect(screen.getByDisplayValue('For the Monday review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Adoption')).toBeInTheDocument();
  });

  test('blocks submission when the name is cleared', () => {
    renderModal();

    setName('  ');

    expect(screen.getByRole('button', { name: 'Buttons.Save' })).toBeDisabled();
  });

  test('sends the new name with the stored body unchanged', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Renamed');
    await submit(user);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.name).toBe('Renamed');
    expect(request.query).toEqual(STRUCTURED.query);
    expect(request.time).toEqual(STRUCTURED.time);
    expect(request.chart).toEqual(STRUCTURED.chart);
    expect(request.result_view).toBe(QueryResultView.Chart);
  });

  test('addresses the replace to the stored query id', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Renamed');
    await submit(user);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    expect(vi.mocked(updateSavedQuery).mock.calls[0][0]).toBe('sq_1');
  });

  test('sends no server-assigned member', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Renamed');
    await submit(user);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    ['id', 'owner_id', 'owner_email', 'source', 'generation', 'created_at', 'updated_at'].forEach((member) => {
      expect(member in request).toBeFalsy();
    });
  });

  test('carries a SQL body across unchanged instead of a structured one', async () => {
    const user = userEvent.setup();
    renderModal({ ...STRUCTURED, query: void 0, sql: 'SELECT count(*) FROM dial_usage_log' });

    setName('Renamed');
    await submit(user);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.sql).toBe('SELECT count(*) FROM dial_usage_log');
    expect('query' in request).toBeFalsy();
  });

  test('offers no scope control to a caller who is not a full administrator', () => {
    renderModal();

    expect(screen.queryByText('Queries.Scope')).not.toBeInTheDocument();
  });

  test('offers the scope control to a full administrator', () => {
    setFullAdmin(true);
    renderModal();

    expect(screen.getByText('Queries.Scope')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Queries.ScopeCommon/ })).toBeInTheDocument();
  });

  test('presents the visibility choices as one radio group', () => {
    setFullAdmin(true);
    renderModal();

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Queries.ScopePersonal/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Queries.ScopeCommon/ })).toBeInTheDocument();
  });

  test('captions both choices, so each consequence is readable without selecting it', () => {
    setFullAdmin(true);
    renderModal();

    expect(screen.getByText('Queries.ScopePersonalHint')).toBeInTheDocument();
    expect(screen.getByText('Queries.ScopeCommonHint')).toBeInTheDocument();
  });

  test('selects the choice the stored query already has', () => {
    setFullAdmin(true);
    renderModal();

    expect(screen.getByRole('radio', { name: /Queries.ScopePersonal/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Queries.ScopeCommon/ })).not.toBeChecked();
  });

  test('shows a common query with that choice already selected', () => {
    setFullAdmin(true);
    renderModal({ ...STRUCTURED, scope: SavedQueryScope.Common });

    expect(screen.getByRole('radio', { name: /Queries.ScopeCommon/ })).toBeChecked();
  });

  test('sends the chosen scope when an administrator changes it', async () => {
    const user = userEvent.setup();
    setFullAdmin(true);
    renderModal();

    await user.click(screen.getByRole('radio', { name: /Queries.ScopeCommon/ }));
    await submit(user);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().scope).toBe(SavedQueryScope.Common);
  });

  test('notifies and closes on success', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Renamed');
    await submit(user);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockShowNotification).toHaveBeenCalled();
  });

  test('keeps the modal open and reports the failure guidance when the replace fails', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({
      success: false,
      errorHeader: 'forbidden',
      errorMessage: 'common writes require FULL_ADMIN',
      requestId: 'trace-2',
    });
    renderModal();

    setName('Renamed');
    await submit(user);

    await waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Queries.ErrorForbidden' }),
    );
  });
});
