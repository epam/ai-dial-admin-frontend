import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AUDIT_LIST_PRESELECT_STORAGE_KEY } from '@/src/constants/audit-list-preselect';
import { ApplicationRoute } from '@/src/types/routes';
import { AuditListPreselect } from '@/src/types/audit-list-preselect';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialConfirmationPopup: ({
    open,
    header,
    children,
    footer,
  }: {
    open: boolean;
    header: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={typeof header === 'string' ? header : ''}>
        <div data-testid="body">{children}</div>
        <div data-testid="footer">{footer}</div>
      </div>
    ) : null,
  DialPrimaryButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button data-variant="primary" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  DialNeutralButton: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button data-variant="neutral" onClick={onClick}>
      {label}
    </button>
  ),
  DialGhostButton: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button data-variant="ghost" onClick={onClick}>
      {label}
    </button>
  ),
  PopupSize: { Sm: 'sm', Md: 'md', Lg: 'lg' },
}));

vi.mock('@/src/components/Deployments/Common/ItemsList/ItemsList', () => ({
  __esModule: true,
  default: () => <div data-testid="items-list" />,
}));

import GlobalWhitelist from '../GlobalWhitelist';
import { ButtonsI18nKey, DeploymentsI18nKey } from '@/src/constants/i18n';

describe('GlobalWhitelist :: View in Activity Audit link', () => {
  const openSpy = vi.spyOn(window, 'open');

  beforeEach(() => {
    localStorage.clear();
    openSpy.mockReset();
    openSpy.mockReturnValue(null);
  });

  const baseProps = {
    isModalOpen: true,
    onClose: vi.fn(),
    onApply: vi.fn(),
    getDomains: vi.fn().mockResolvedValue({ success: true, response: ['aws.com'] }),
  };

  test('renders the link in the footer', () => {
    render(<GlobalWhitelist {...baseProps} />);
    expect(screen.getByText(DeploymentsI18nKey.ViewInActivityAudit)).toBeInTheDocument();
  });

  test('renders Cancel (neutral) and Apply (primary) buttons in the footer', async () => {
    render(<GlobalWhitelist {...baseProps} />);
    const cancel = await screen.findByText(ButtonsI18nKey.Cancel);
    const apply = screen.getByText(ButtonsI18nKey.Apply);
    expect(cancel.getAttribute('data-variant')).toBe('neutral');
    expect(apply.getAttribute('data-variant')).toBe('primary');
  });

  test('renders Close instead of Apply in read-only (disabled) mode and keeps the link visible', async () => {
    render(<GlobalWhitelist {...baseProps} disabled />);
    expect(screen.getByText(DeploymentsI18nKey.ViewInActivityAudit)).toBeInTheDocument();
    expect(await screen.findByText(ButtonsI18nKey.Close)).toBeInTheDocument();
    expect(screen.queryByText(ButtonsI18nKey.Apply)).not.toBeInTheDocument();
  });

  test('clicking the link writes the preselect, opens a new tab, and does NOT close the popup', () => {
    const onClose = vi.fn();
    render(<GlobalWhitelist {...baseProps} onClose={onClose} />);

    fireEvent.click(screen.getByText(DeploymentsI18nKey.ViewInActivityAudit));

    expect(localStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBe(AuditListPreselect.GlobalFirewall);
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(ApplicationRoute.ActivityAudit, '_blank');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('preselect is written to localStorage before window.open is called', () => {
    let storageAtOpen: string | null = null;
    openSpy.mockImplementation(() => {
      storageAtOpen = localStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY);
      return null;
    });

    render(<GlobalWhitelist {...baseProps} />);
    fireEvent.click(screen.getByText(DeploymentsI18nKey.ViewInActivityAudit));

    expect(storageAtOpen).toBe(AuditListPreselect.GlobalFirewall);
  });

  test('Cancel button invokes onClose without touching localStorage or opening tabs', async () => {
    const onClose = vi.fn();
    render(<GlobalWhitelist {...baseProps} onClose={onClose} />);

    const cancelBtn = await screen.findByText(ButtonsI18nKey.Cancel);
    fireEvent.click(cancelBtn);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(localStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBeNull();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
