import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ExternalServiceI18nKey } from '@/src/constants/i18n';
import { DialExternalService, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/resource';
import ExternalServiceConsentActions from '../ExternalServiceConsentActions';

const { showNotification } = vi.hoisted(() => ({ showNotification: vi.fn() }));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const APP_PATH = 'public/my-app';
const SERVICE_ID = 'dial';

const notApproved: DialExternalService = {
  auth_settings: {
    authentication_type: ToolsetAuthType.DIAL_NATIVE,
    app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
  },
};

const approved: DialExternalService = {
  auth_settings: {
    authentication_type: ToolsetAuthType.DIAL_NATIVE,
    app_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
  },
};

describe('ExternalServiceConsentActions', () => {
  const user = userEvent.setup();
  const refresh = vi.fn();
  const grantConsent = vi.fn();
  const withdrawConsent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
    grantConsent.mockResolvedValue({ success: true });
    withdrawConsent.mockResolvedValue({ success: true });
  });

  const renderActions = (service: DialExternalService) =>
    render(
      <ExternalServiceConsentActions
        appPath={APP_PATH}
        applicationName="My App"
        serviceId={SERVICE_ID}
        service={service}
        grantConsent={grantConsent}
        withdrawConsent={withdrawConsent}
      />,
    );

  const confirmDialog = async (label: string) => {
    const buttons = screen.getAllByRole('button', { name: label });
    await user.click(buttons[buttons.length - 1]);
  };

  test('opens the confirmation dialog without sending a request', async () => {
    renderActions(notApproved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent }));

    expect(screen.getByText(ExternalServiceI18nKey.GrantConsentDescription)).toBeInTheDocument();
    expect(grantConsent).not.toHaveBeenCalled();
  });

  test('cancelling the dialog sends no request', async () => {
    renderActions(notApproved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(grantConsent).not.toHaveBeenCalled();
    expect(screen.queryByText(ExternalServiceI18nKey.GrantConsentDescription)).not.toBeInTheDocument();
  });

  test('granting consent calls the action, notifies and re-reads the application', async () => {
    renderActions(notApproved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent }));
    await confirmDialog(ExternalServiceI18nKey.GrantConsent);

    await waitFor(() => expect(grantConsent).toHaveBeenCalledWith(APP_PATH, SERVICE_ID));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ExternalServiceI18nKey.SuccessGrantConsent }),
    );
  });

  test('withdrawing consent calls the withdraw action', async () => {
    renderActions(approved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.WithdrawConsent }));
    await confirmDialog(ExternalServiceI18nKey.WithdrawConsent);

    await waitFor(() => expect(withdrawConsent).toHaveBeenCalledWith(APP_PATH, SERVICE_ID));
    expect(grantConsent).not.toHaveBeenCalled();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  test('a withdrawal that removed nothing surfaces no error', async () => {
    withdrawConsent.mockResolvedValue({ success: true, response: false });
    renderActions(approved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.WithdrawConsent }));
    await confirmDialog(ExternalServiceI18nKey.WithdrawConsent);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ExternalServiceI18nKey.SuccessWithdrawConsent }),
    );
  });

  test('a failed grant notifies the error and leaves the row unchanged', async () => {
    grantConsent.mockResolvedValue({ success: false, status: 500, errorHeader: 'Boom', errorMessage: 'Server error' });
    renderActions(notApproved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent }));
    await confirmDialog(ExternalServiceI18nKey.GrantConsent);

    await waitFor(() => expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Boom' })));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).toBeInTheDocument();
  });

  test('a 404 from a stale declaration re-reads the application', async () => {
    grantConsent.mockResolvedValue({ success: false, status: 404, errorHeader: 'Not found' });
    renderActions(notApproved);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent }));
    await confirmDialog(ExternalServiceI18nKey.GrantConsent);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Not found' }));
  });
});
