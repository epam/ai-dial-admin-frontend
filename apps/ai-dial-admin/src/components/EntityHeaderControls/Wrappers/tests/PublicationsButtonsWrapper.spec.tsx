import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import PublicationsButtonsWrapper from '@/src/components/EntityHeaderControls/Wrappers/PublicationsButtonsWrapper';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { ActionType, Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { approvePublication, declinePublication, deletePublication } from '@/src/app/actions/publications';

vi.mock('@/src/app/actions/publications', () => ({
  approvePublication: vi.fn(),
  declinePublication: vi.fn(),
  deletePublication: vi.fn(),
}));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));
vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsOnlyTabletScreen: () => false }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

// The global `t()` mock drops interpolation params — override it here so the notification title/
// description embed `entity`/`entityId`, the only way to assert which key and params were used.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, options?: Record<string, string>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
  useCurrentLocale: () => 'en',
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  NotificationVariant: { Info: 'info' },
  ButtonAppearance: { Outlined: 'outlined' },
  DialNotification: ({ message }: { message: ReactNode }) => <div>{message}</div>,
  DialConfirmationPopup: ({
    open,
    header,
    description,
    children,
    onConfirm,
    onClose,
    confirmLabel,
    disableConfirmButton,
  }: {
    open: boolean;
    header: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    onConfirm: () => void;
    onClose: () => void;
    confirmLabel: ReactNode;
    disableConfirmButton?: boolean;
  }) =>
    open ? (
      <div role="dialog" aria-label={typeof header === 'string' ? header : ''}>
        {description}
        {children}
        <button onClick={onClose}>close</button>
        <button onClick={onConfirm} disabled={disableConfirmButton}>
          {confirmLabel}
        </button>
      </div>
    ) : null,
  DialDangerButton: ({ label, onClick }: { label: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
  DialNeutralButton: ({ label, onClick }: { label: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
  DialPrimaryButton: ({ label, onClick }: { label: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
  DialTextarea: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

const basePublication = (action: ActionType): Publication => ({
  path: 'publications/public/request-path',
  requestName: 'my-request',
  author: 'author@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  status: 'pending',
  action,
  folderId: 'public/',
  rules: [{}] as never,
});

const renderWrapper = (action: ActionType) =>
  render(
    <PublicationsButtonsWrapper
      view={ApplicationRoute.ApplicationPublications}
      isChanged={false}
      entity={basePublication(action)}
      onDiscard={vi.fn()}
      onSave={vi.fn()}
    />,
  );

describe('PublicationsButtonsWrapper :: success notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  test('publishing an add-action publication shows a publish success notification', async () => {
    vi.mocked(approvePublication).mockResolvedValue({ success: true });
    renderWrapper(ActionType.ADD);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Publish' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Publish' }));

    await waitFor(() => expect(approvePublication).toHaveBeenCalledWith('publications/public/request-path'));
    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());

    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toContain(PublicationsI18nKey.NotificationPublishTitle);
    expect(notification.title).toContain(PublicationsI18nKey.ApplicationPublicationEntity);
    expect(notification.description).toContain(PublicationsI18nKey.NotificationPublishDescription);
    expect(notification.description).toContain('my-request');
    expect(push).toHaveBeenCalledWith(ApplicationRoute.ApplicationPublications);
  });

  test('unpublishing a delete-action publication shows an unpublish success notification', async () => {
    vi.mocked(approvePublication).mockResolvedValue({ success: true });
    renderWrapper(ActionType.DELETE);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Unpublish' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Unpublish' }));

    await waitFor(() => expect(approvePublication).toHaveBeenCalledOnce());
    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());

    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toContain(PublicationsI18nKey.NotificationUnpublishTitle);
    expect(notification.description).toContain(PublicationsI18nKey.NotificationUnpublishDescription);
    expect(notification.description).toContain('my-request');
  });

  test('declining a publication shows a decline success notification', async () => {
    vi.mocked(declinePublication).mockResolvedValue({ success: true });
    renderWrapper(ActionType.ADD);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Decline' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'a valid decline reason' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Decline' }));

    await waitFor(() =>
      expect(declinePublication).toHaveBeenCalledWith('publications/public/request-path', 'a valid decline reason'),
    );
    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());

    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toContain(PublicationsI18nKey.NotificationDeclineTitle);
    expect(notification.description).toContain(PublicationsI18nKey.NotificationDeclineDescription);
    expect(notification.description).toContain('my-request');
  });

  test('deleting a publication request shows a delete success notification', async () => {
    vi.mocked(deletePublication).mockResolvedValue({ success: true });
    renderWrapper(ActionType.ADD);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Delete' }));

    await waitFor(() => expect(deletePublication).toHaveBeenCalledWith('publications/public/request-path'));
    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());

    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toContain(PublicationsI18nKey.NotificationDeleteTitle);
    expect(notification.description).toContain(PublicationsI18nKey.NotificationDeleteDescription);
    expect(notification.description).toContain('my-request');
  });
});

describe('PublicationsButtonsWrapper :: failure path preserved', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  test('a failed approve shows only the existing error notification', async () => {
    vi.mocked(approvePublication).mockResolvedValue({
      success: false,
      errorHeader: 'Error.Header',
      errorMessage: 'Error.Message',
    });
    renderWrapper(ActionType.ADD);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Publish' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Publish' }));

    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toBe('Error.Header');
    expect(notification.description).toBe('Error.Message');
    expect(push).not.toHaveBeenCalled();
  });

  test('a failed decline shows only the existing error notification', async () => {
    vi.mocked(declinePublication).mockResolvedValue({
      success: false,
      errorHeader: 'Error.Header',
      errorMessage: 'Error.Message',
    });
    renderWrapper(ActionType.ADD);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Decline' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'a valid decline reason' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Decline' }));

    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toBe('Error.Header');
    expect(notification.description).toBe('Error.Message');
  });

  test('a failed delete shows only the existing error notification', async () => {
    vi.mocked(deletePublication).mockResolvedValue({
      success: false,
      errorHeader: 'Error.Header',
      errorMessage: 'Error.Message',
    });
    renderWrapper(ActionType.ADD);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Buttons.Delete' }));

    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    const notification = showNotification.mock.calls[0][0];
    expect(notification.title).toBe('Error.Header');
    expect(notification.description).toBe('Error.Message');
  });
});
