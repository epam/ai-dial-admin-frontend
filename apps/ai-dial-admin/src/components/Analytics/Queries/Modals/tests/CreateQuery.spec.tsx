import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createSavedQuery } from '@/src/app/[lang]/queries/actions';
import CreateQuery from '@/src/components/Analytics/Queries/Modals/CreateQuery';
import { AnalyticsEntity } from '@/src/models/analytics/entity';
import { QueryMode } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryRequest, SavedQueryScope } from '@/src/models/analytics/saved-query';

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

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }, { name: 'other_table' }];

const onClose = vi.fn();

const renderModal = (entities = ENTITIES) => render(<CreateQuery entities={entities} onClose={onClose} />);

const sentRequest = () => vi.mocked(createSavedQuery).mock.calls[0][0] as SavedQueryRequest;

const typeName = (name: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: /EntityFields.displayName/ }), { target: { value: name } });
};

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));
};

describe('CreateQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSavedQuery).mockResolvedValue({
      success: true,
      response: {
        id: 'sq_new',
        name: 'Top chats',
        scope: SavedQueryScope.Personal,
        generation: 1,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
      },
    });
  });

  test('renders the metadata fields and asks for no source or scope', () => {
    renderModal();

    expect(screen.getByText('Queries.CreateQuery')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /EntityFields.displayName/ })).toBeInTheDocument();
    expect(screen.queryByText('Queries.Source')).not.toBeInTheDocument();
    expect(screen.queryByText('Queries.Scope')).not.toBeInTheDocument();
  });

  test('blocks submission while the name is blank', () => {
    renderModal();

    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeDisabled();
  });

  test('enables submission once a name is entered', async () => {
    const user = userEvent.setup();
    renderModal();

    typeName('Top chats');

    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeEnabled();
  });

  test('sends an executable body against the first source, since a bodyless query is refused', async () => {
    const user = userEvent.setup();
    renderModal();

    typeName('Top chats');
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.name).toBe('Top chats');
    expect(request.query?.entity).toBe('dial_usage_log');
    expect(request.query?.mode).toBe(QueryMode.Row);
    expect(request.result_view).toBe(QueryResultView.Table);
  });

  test('omits scope so the service resolves it to personal', async () => {
    const user = userEvent.setup();
    renderModal();

    typeName('Top chats');
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().scope).toBe(SavedQueryScope.Personal);
  });

  test('omits a blank description and tag rather than sending empty strings', async () => {
    const user = userEvent.setup();
    renderModal();

    typeName('Top chats');
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect('description' in request).toBeFalsy();
    expect('tag' in request).toBeFalsy();
  });

  test('notifies and navigates to the created query on success', async () => {
    const user = userEvent.setup();
    renderModal();

    typeName('Top chats');
    await submit(user);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/queries/sq_new'));
    expect(mockShowNotification).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('keeps the modal open with its values when the create fails', async () => {
    const user = userEvent.setup();
    vi.mocked(createSavedQuery).mockResolvedValue({
      success: false,
      errorHeader: 'validation_error',
      errorMessage: 'name must not be blank',
      requestId: 'trace-1',
    });
    renderModal();

    typeName('Top chats');
    await submit(user);

    await waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Top chats')).toBeInTheDocument();
  });

  test('sends an empty source when no entities are available, leaving the refusal to the service', async () => {
    const user = userEvent.setup();
    renderModal([]);

    typeName('Top chats');
    await submit(user);

    await waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().query?.entity).toBe('');
  });
});
