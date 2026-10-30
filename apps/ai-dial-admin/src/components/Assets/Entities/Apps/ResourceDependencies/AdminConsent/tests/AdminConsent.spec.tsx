import { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { AdminConsentStatus, ResourceAccess, ResourceDependency } from '@/src/models/dial/resource-dependency';
import AdminConsent from '../AdminConsent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn(() => false) }));

const makeDependency = (path: string, access = [ResourceAccess.Read]): ResourceDependency => ({
  kind: 'dial.resourceLink',
  link_id: path,
  target: { path },
  access,
  required: false,
});

const SAVED = [
  makeDependency('skills/{current-user}/', [ResourceAccess.Read, ResourceAccess.Write]),
  makeDependency('files/public/folder/'),
];

const NO_RECORD: AdminConsentStatus = { consented: false };
const CONSENTED: AdminConsentStatus = {
  consented: true,
  grantedBy: 'admin@example.com',
  grantedAt: Date.UTC(2026, 9, 1, 12, 0, 0),
  grantedResources: [{ path: 'skills/{current-user}/', access: [ResourceAccess.Write, ResourceAccess.Read] }],
};
const STALE: AdminConsentStatus = {
  consented: false,
  stale: true,
  grantedBy: 'admin@example.com',
  grantedAt: Date.UTC(2026, 9, 1, 12, 0, 0),
  grantedResources: [{ path: 'files/public/old/', access: [ResourceAccess.Read] }],
};

describe('AdminConsent', () => {
  const user = userEvent.setup();
  const onApprove = vi.fn();
  const onRevoke = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
    onApprove.mockResolvedValue(undefined);
    onRevoke.mockResolvedValue(undefined);
  });

  const renderConsent = (props?: Partial<ComponentProps<typeof AdminConsent>>) =>
    render(
      <AdminConsent
        savedDependencies={SAVED}
        isDirty={false}
        status={NO_RECORD}
        isLoading={false}
        isMutating={false}
        onApprove={onApprove}
        onRevoke={onRevoke}
        {...props}
      />,
    );

  const button = (name: string) => screen.queryByRole('button', { name });

  describe('AdminConsent — states', () => {
    test('shows a spinner and no buttons while the status loads', () => {
      renderConsent({ status: undefined, isLoading: true });

      expect(screen.getByLabelText(ResourceDependenciesI18nKey.ConsentLoading)).toBeTruthy();
      expect(button(ButtonsI18nKey.Approve)).toBeNull();
      expect(screen.queryByText(ResourceDependenciesI18nKey.Status)).toBeNull();
    });

    test('offers only Approve when nothing was ever approved', () => {
      renderConsent();

      expect(screen.getByText(ResourceDependenciesI18nKey.NotApproved)).toBeTruthy();
      expect(button(ButtonsI18nKey.Approve)).toBeTruthy();
      expect(button(ResourceDependenciesI18nKey.ReApprove)).toBeNull();
      expect(button(ResourceDependenciesI18nKey.Revoke)).toBeNull();
      expect(screen.queryByText(ResourceDependenciesI18nKey.ApprovedResources)).toBeNull();
    });

    test('shows approval details and offers only Revoke when approved', () => {
      renderConsent({ status: CONSENTED });

      expect(screen.getByText(ResourceDependenciesI18nKey.Approved)).toBeTruthy();
      expect(screen.getByText('admin@example.com')).toBeTruthy();
      expect(screen.getByText('skills/{current-user}/ (WRITE, READ)')).toBeTruthy();
      expect(button(ResourceDependenciesI18nKey.Revoke)).toBeTruthy();
      expect(button(ButtonsI18nKey.Approve)).toBeNull();
      expect(button(ResourceDependenciesI18nKey.ReApprove)).toBeNull();
      expect(screen.queryByText(ResourceDependenciesI18nKey.StaleNote)).toBeNull();
    });

    test('flags a stale approval and offers Re-Approve and Revoke', () => {
      renderConsent({ status: STALE });

      expect(screen.getByText(ResourceDependenciesI18nKey.NotApproved)).toBeTruthy();
      expect(screen.getByText(ResourceDependenciesI18nKey.StaleNote).className).toContain('text-error');
      expect(screen.getByText('files/public/old/ (READ)')).toBeTruthy();
      expect(button(ResourceDependenciesI18nKey.ReApprove)).toBeTruthy();
      expect(button(ResourceDependenciesI18nKey.Revoke)).toBeTruthy();
      expect(button(ButtonsI18nKey.Approve)).toBeNull();
    });

    test('offers no button when nothing is saved', () => {
      renderConsent({ savedDependencies: undefined, status: NO_RECORD });

      expect(button(ButtonsI18nKey.Approve)).toBeNull();
      expect(button(ResourceDependenciesI18nKey.Revoke)).toBeNull();
    });

    test('announces the status through a live region', () => {
      renderConsent({ status: CONSENTED });

      expect(screen.getByRole('status').textContent).toBe(ResourceDependenciesI18nKey.ConsentStatusLabel);
    });
  });

  describe('AdminConsent — unsaved changes', () => {
    test('disables approving and explains why, without colouring the note as an error', () => {
      renderConsent({ isDirty: true, status: STALE });

      expect(screen.getByRole('button', { name: ResourceDependenciesI18nKey.ReApprove })).toBeDisabled();
      expect(screen.getByRole('button', { name: ResourceDependenciesI18nKey.Revoke })).toBeEnabled();
      expect(screen.getByText(ResourceDependenciesI18nKey.SavedDefinitionNote).className).not.toContain('text-error');
    });

    test('keeps Approve disabled for a declaration that was never approved', () => {
      renderConsent({ isDirty: true });

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Approve })).toBeDisabled();
    });
  });

  describe('AdminConsent — dialogs', () => {
    test('approve lists the saved declaration and sends nothing until confirmed', async () => {
      renderConsent();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Approve }));

      expect(screen.getByText(ResourceDependenciesI18nKey.ApproveTitle)).toBeTruthy();
      expect(screen.getByText('skills/{current-user}/ (READ, WRITE)')).toBeTruthy();
      expect(screen.getByText('files/public/folder/ (READ)')).toBeTruthy();
      expect(onApprove).not.toHaveBeenCalled();
    });

    test('cancelling the approve dialog sends nothing', async () => {
      renderConsent();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Approve }));
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(onApprove).not.toHaveBeenCalled();
      expect(screen.queryByText(ResourceDependenciesI18nKey.ApproveTitle)).toBeNull();
    });

    test('confirming approve calls the callback and closes the dialog', async () => {
      renderConsent();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Approve }));
      const confirm = screen.getAllByRole('button', { name: ButtonsI18nKey.Approve }).at(-1) as HTMLElement;
      await user.click(confirm);

      await vi.waitFor(() => expect(screen.queryByText(ResourceDependenciesI18nKey.ApproveTitle)).toBeNull());
      expect(onApprove).toHaveBeenCalledOnce();
      expect(onRevoke).not.toHaveBeenCalled();
    });

    test('re-approve opens the same dialog', async () => {
      renderConsent({ status: STALE });

      await user.click(screen.getByRole('button', { name: ResourceDependenciesI18nKey.ReApprove }));

      expect(screen.getByText(ResourceDependenciesI18nKey.ApproveTitle)).toBeTruthy();
    });

    test('revoke lists what is currently approved, not the saved declaration', async () => {
      renderConsent({ status: STALE });

      await user.click(screen.getByRole('button', { name: ResourceDependenciesI18nKey.Revoke }));

      expect(screen.getByText(ResourceDependenciesI18nKey.RevokeTitle)).toBeTruthy();
      expect(screen.getAllByText('files/public/old/ (READ)').length).toBeGreaterThan(1);
      expect(screen.queryByText('files/public/folder/ (READ)')).toBeNull();
    });

    test('confirming revoke calls the revoke callback only', async () => {
      renderConsent({ status: CONSENTED });

      await user.click(screen.getByRole('button', { name: ResourceDependenciesI18nKey.Revoke }));
      const confirm = screen.getAllByRole('button', { name: ResourceDependenciesI18nKey.Revoke }).at(-1) as HTMLElement;
      await user.click(confirm);

      await vi.waitFor(() => expect(onRevoke).toHaveBeenCalledOnce());
      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  describe('AdminConsent — read-only admin', () => {
    test('shows the state without any button', () => {
      vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

      renderConsent({ status: STALE });

      expect(screen.getByText(ResourceDependenciesI18nKey.StaleNote)).toBeTruthy();
      expect(screen.queryByRole('button')).toBeNull();
    });
  });
});
