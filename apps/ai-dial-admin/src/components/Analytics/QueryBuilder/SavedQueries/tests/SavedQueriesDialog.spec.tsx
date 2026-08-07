import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SavedQueriesDialog from '@/src/components/Analytics/QueryBuilder/SavedQueries/SavedQueriesDialog';
import { useAppContext } from '@/src/context/AppContext';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

// Delete is gated on the role for `common` rows, so this spec varies it rather than using the fixed
// shared mock.
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

const setRoles = ({ isFullAdmin = true, isEnableAuth = true } = {}) => {
  vi.mocked(useAppContext).mockReturnValue({ isFullAdmin, isEnableAuth } as ReturnType<typeof useAppContext>);
};

const savedQuery = (overrides: Partial<SavedQuery> = {}): SavedQuery => ({
  id: 'sq_1',
  name: 'Top chats',
  scope: SavedQueryScope.Personal,
  source: 'conversations',
  query: { entity: 'conversations', mode: 'row' },
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  ...overrides,
});

const PERSONAL = [
  savedQuery({ id: 'sq_1', name: 'Top chats', tag: 'Adoption' }),
  savedQuery({ id: 'sq_2', name: 'Requests per day', tag: 'Adoption' }),
  savedQuery({ id: 'sq_3', name: 'Untagged one' }),
];

const COMMON = [
  savedQuery({
    id: 'sq_9',
    name: 'Shared cost outliers',
    scope: SavedQueryScope.Common,
    sql: 'SELECT 1',
    query: undefined,
    owner_email: 'maria@epam.com',
  }),
];

const renderDialog = (overrides: Partial<Parameters<typeof SavedQueriesDialog>[0]> = {}) => {
  const props = {
    open: true,
    queriesFor: (scope: SavedQueryScope) => (scope === SavedQueryScope.Personal ? PERSONAL : COMMON),
    onLoadScope: vi.fn(),
    hasUnsavedChanges: false,
    onOpenQuery: vi.fn(),
    onDeleteQuery: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<SavedQueriesDialog {...props} />);
  return props;
};

describe('QueryBuilder :: SavedQueriesDialog', () => {
  beforeEach(() => setRoles());

  test('lists rows grouped by tag, keeping the server order within a group', () => {
    renderDialog();

    const rows = screen.getAllByRole('button').filter((b) => b.textContent?.includes('Top chats'));
    expect(rows.length).toBe(1);
    expect(screen.getByText('Adoption')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.SavedQueriesUntagged')).toBeInTheDocument();

    // Server order is update order — the only ordering signal the response carries.
    const names = screen.getAllByText(/Top chats|Requests per day|Untagged one/).map((n) => n.textContent);
    expect(names).toEqual(['Top chats', 'Requests per day', 'Untagged one']);
  });

  test('selecting a row previews it without opening the query', async () => {
    const user = userEvent.setup();
    const { onOpenQuery } = renderDialog();

    await user.click(screen.getByText('Top chats'));

    expect(onOpenQuery).not.toHaveBeenCalled();
    expect(screen.getByText('QueryBuilder.SavedQueryShowsAs')).toBeInTheDocument();
  });

  test('the footer action opens the selected query', async () => {
    const user = userEvent.setup();
    const { onOpenQuery } = renderDialog();

    await user.click(screen.getByText('Top chats'));
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SavedQueriesOpen' }));

    expect(onOpenQuery).toHaveBeenCalledWith(expect.objectContaining({ id: 'sq_1' }));
  });

  test('double-clicking a row opens it', async () => {
    const user = userEvent.setup();
    const { onOpenQuery } = renderDialog();

    await user.dblClick(screen.getByText('Top chats'));

    expect(onOpenQuery).toHaveBeenCalledWith(expect.objectContaining({ id: 'sq_1' }));
  });

  test('search filters the list and shows its own empty state', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText('QueryBuilder.SavedQueriesSearch'), 'requests');
    expect(screen.queryByText('Top chats')).not.toBeInTheDocument();
    expect(screen.getByText('Requests per day')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('QueryBuilder.SavedQueriesSearch'), 'zzz');
    expect(screen.getByText('QueryBuilder.SavedQueriesNoMatches')).toBeInTheDocument();
  });

  test('with unsaved changes the footer becomes the confirmation instead of a second dialog', async () => {
    const user = userEvent.setup();
    const { onOpenQuery } = renderDialog({ hasUnsavedChanges: true });

    await user.dblClick(screen.getByText('Top chats'));

    expect(onOpenQuery).not.toHaveBeenCalled();
    expect(screen.getByText('QueryBuilder.SavedQueryDiscardPrompt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryKeepEditing' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryDiscardAndOpen' }));
    expect(onOpenQuery).toHaveBeenCalledWith(expect.objectContaining({ id: 'sq_1' }));
  });

  test('keep editing dismisses the confirmation without opening', async () => {
    const user = userEvent.setup();
    const { onOpenQuery } = renderDialog({ hasUnsavedChanges: true });

    await user.dblClick(screen.getByText('Top chats'));
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryKeepEditing' }));

    expect(onOpenQuery).not.toHaveBeenCalled();
    expect(screen.queryByText('QueryBuilder.SavedQueryDiscardPrompt')).not.toBeInTheDocument();
  });

  test('switching to Common loads that scope and shows its rows', async () => {
    const user = userEvent.setup();
    const { onLoadScope } = renderDialog();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.SavedQueriesCommon' }));

    expect(onLoadScope).toHaveBeenCalledWith(SavedQueryScope.Common);
    expect(screen.getByText('Shared cost outliers')).toBeInTheDocument();
  });

  test('a row shows its name and source, and no editor chip', () => {
    renderDialog({ queriesFor: () => COMMON });

    expect(screen.getByText('Shared cost outliers')).toBeInTheDocument();
    ['SQL', 'JSON', 'Builder'].forEach((label) => expect(screen.queryByText(label)).not.toBeInTheDocument());
  });

  test('attribution shows under Common and never under personal', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByText('Top chats'));
    expect(screen.queryByText('QueryBuilder.SavedQuerySavedBy')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.SavedQueriesCommon' }));
    await user.click(screen.getByText('Shared cost outliers'));
    expect(screen.getByText('QueryBuilder.SavedQuerySavedBy')).toBeInTheDocument();
    expect(screen.getByText('maria@epam.com')).toBeInTheDocument();
  });

  test('a common row with no author email falls back to a neutral placeholder', async () => {
    const user = userEvent.setup();
    renderDialog({ queriesFor: () => [{ ...COMMON[0], owner_email: undefined }] });

    await user.click(screen.getByText('Shared cost outliers'));

    expect(screen.getByText('QueryBuilder.SavedQueryAuthorUnknown')).toBeInTheDocument();
  });

  test('a stored relative period is previewed as relative', async () => {
    const user = userEvent.setup();
    renderDialog({
      queriesFor: () => [savedQuery({ time: { mode: SavedQueryTimeMode.Relative, period: '2d' } })],
    });

    await user.click(screen.getByText('Top chats'));

    expect(screen.getByText('QueryBuilder.SavedQueryPeriodRelative')).toBeInTheDocument();
  });

  test('a row can be deleted without opening it, confirming in the footer', async () => {
    const user = userEvent.setup();
    const { onDeleteQuery, onOpenQuery } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Buttons.Delete Top chats' }));

    // Confirmed in this dialog's own footer, not a stacked popup.
    expect(screen.getByText('QueryBuilder.SavedQueryDeleteDescription')).toBeInTheDocument();
    expect(onDeleteQuery).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(onDeleteQuery).toHaveBeenCalledWith(expect.objectContaining({ id: 'sq_1' }));
    expect(onOpenQuery).not.toHaveBeenCalled();
  });

  test('cancelling the delete confirmation removes nothing', async () => {
    const user = userEvent.setup();
    const { onDeleteQuery } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Buttons.Delete Top chats' }));
    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));

    expect(onDeleteQuery).not.toHaveBeenCalled();
    expect(screen.queryByText('QueryBuilder.SavedQueryDeleteDescription')).not.toBeInTheDocument();
  });

  test('a common row offers no delete without the full admin role', async () => {
    const user = userEvent.setup();
    setRoles({ isFullAdmin: false });
    renderDialog();

    // Personal rows are the caller's own, so they stay deletable.
    expect(screen.getByRole('button', { name: 'Buttons.Delete Top chats' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.SavedQueriesCommon' }));

    expect(screen.queryByRole('button', { name: 'Buttons.Delete Shared cost outliers' })).not.toBeInTheDocument();
  });

  test('an empty scope shows its own empty state', () => {
    renderDialog({ queriesFor: () => [] });

    expect(screen.getByText('QueryBuilder.SavedQueriesEmptyPersonalTitle')).toBeInTheDocument();
  });
});
