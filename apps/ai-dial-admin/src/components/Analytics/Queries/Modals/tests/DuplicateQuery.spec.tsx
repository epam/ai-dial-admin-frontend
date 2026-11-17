import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createSavedQuery, updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import DuplicateQuery from '@/src/components/Analytics/Queries/Modals/DuplicateQuery';
import { QueryMetadataForm } from '@/src/components/Analytics/Queries/models';
import { SourcePanelProvider, useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { useAppContext } from '@/src/context/AppContext';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryRequest, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions');

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
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
  source: ['dial_usage_log'],
  query: { entity: 'dial_usage_log', mode: QueryMode.Aggregate },
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  result_view: QueryResultView.Chart,
  chart: { type: ChartType.Bar, x_field: 'project', y_field: ['count'] },
  generation: 3,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
};

const COMMON: SavedQuery = { ...STRUCTURED, id: 'sq_2', name: 'Shared', scope: SavedQueryScope.Common };

const CREATED: SavedQuery = { ...STRUCTURED, id: 'sq_new', name: 'Top chats (copy)' };

const onClose = vi.fn();

const buildRequest = vi.fn(
  (meta: QueryMetadataForm): SavedQueryRequest => ({
    name: meta.name,
    description: meta.description,
    tag: meta.tag,
    scope: meta.scope,
    sql: 'SELECT 1',
    result_view: QueryResultView.Table,
  }),
);

const renderModal = (query: SavedQuery | undefined = STRUCTURED) =>
  render(<DuplicateQuery query={query} onClose={onClose} buildRequest={buildRequest} />);

const sentRequest = () => vi.mocked(createSavedQuery).mock.calls[0][0] as SavedQueryRequest;

const setName = (name: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: /EntityFields.displayName/ }), { target: { value: name } });
};

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Buttons.Save' }));
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

    expect(screen.getByRole('button', { name: 'Buttons.Save' })).toBeDisabled();
  });

  test('accepts a name another query already uses, since the service enforces no uniqueness', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Shared');
    await submit(user);

    await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().name).toBe('Shared');
  });

  test('sends the metadata entered in the modal', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Weekly adoption');
    await submit(user);

    await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.name).toBe('Weekly adoption');
    expect(request.description).toBe('For the Monday review');
    expect(request.tag).toBe('Adoption');
  });

  test('creates a new query rather than replacing the source', async () => {
    const user = userEvent.setup();
    renderModal();

    await submit(user);

    await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(updateSavedQuery).not.toHaveBeenCalled();
  });

  test('navigates to the created copy, not the source', async () => {
    const user = userEvent.setup();
    renderModal();

    await submit(user);

    await vi.waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sq_new'));
    expect(onClose).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalled();
  });

  test('turns the Source panel to its Queries tab when it navigates to the created query', async () => {
    const user = userEvent.setup();
    const SelectedTab: FC = () => <p>tab: {useSourcePanel().selectedTab ?? 'none'}</p>;
    render(
      <SourcePanelProvider tables={[]} queries={[]}>
        <SelectedTab />
        <DuplicateQuery query={void 0} onClose={onClose} buildRequest={buildRequest} />
      </SourcePanelProvider>,
    );
    expect(screen.getByText('tab: none')).toBeInTheDocument();
    setName('From a draft');

    await submit(user);

    expect(await screen.findByText(`tab: ${SourcePanelTab.Queries}`)).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sq_new'));
  });

  test('leaves the Source panel tab alone when the caller handles the created query', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const SelectedTab: FC = () => <p>tab: {useSourcePanel().selectedTab ?? 'none'}</p>;
    render(
      <SourcePanelProvider tables={[]} queries={[]}>
        <SelectedTab />
        <DuplicateQuery query={STRUCTURED} onClose={onClose} buildRequest={buildRequest} onCreated={onCreated} />
      </SourcePanelProvider>,
    );

    await submit(user);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Buttons.Save' })).toBeEnabled());
    expect(onCreated).toHaveBeenCalledOnce();
    expect(screen.getByText('tab: none')).toBeInTheDocument();
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

    await vi.waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Queries.ErrorForbidden' }),
    );
  });

  test('reports a transport failure and re-enables submit instead of staying stuck', async () => {
    const user = userEvent.setup();
    vi.mocked(createSavedQuery).mockRejectedValue(new Error('network down'));
    renderModal();

    await submit(user);

    await vi.waitFor(() =>
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error.Error', description: 'Queries.ErrorGeneric' }),
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Buttons.Save' })).toBeEnabled();
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

    await vi.waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
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

    await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
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

    await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().scope).toBe(SavedQueryScope.Personal);
  });
  test('sends what the injected builder returns for the entered metadata', async () => {
    const user = userEvent.setup();
    renderModal();

    setName('Edited variant');
    await submit(user);

    await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(buildRequest).toHaveBeenCalledWith(expect.objectContaining({ name: 'Edited variant', tag: 'Adoption' }));
    expect(sentRequest().sql).toBe('SELECT 1');
  });

  test('hands the created query to onCreated instead of notifying, closing, and navigating', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<DuplicateQuery query={STRUCTURED} onClose={onClose} buildRequest={buildRequest} onCreated={onCreated} />);

    await submit(user);

    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith(CREATED));
    expect(mockPush).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
  });

  test('renders the Save query as header', () => {
    renderModal();

    expect(screen.getByText('Queries.SaveQueryAs')).toBeInTheDocument();
  });

  describe('without a source query', () => {
    const renderUnseeded = () => render(<DuplicateQuery onClose={onClose} buildRequest={buildRequest} />);

    test('starts with an empty name and blocks submission', () => {
      renderUnseeded();

      expect(screen.getByRole('textbox', { name: /EntityFields.displayName/ })).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Buttons.Save' })).toBeDisabled();
    });

    test('defaults to the personal scope and navigates to the created query', async () => {
      const user = userEvent.setup();
      setFullAdmin(true);
      renderUnseeded();

      setName('From a draft');
      await submit(user);

      await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sq_new')));
      expect(sentRequest().scope).toBe(SavedQueryScope.Personal);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
