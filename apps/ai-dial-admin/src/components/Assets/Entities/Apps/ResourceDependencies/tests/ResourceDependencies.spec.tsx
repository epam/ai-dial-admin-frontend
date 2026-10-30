import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getAdminConsentStatus,
  grantAdminConsent,
  withdrawAdminConsent,
} from '@/src/app/[lang]/assets-applications/actions';
import { ButtonsI18nKey, ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { DialApplication } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { AdminConsentStatus, ResourceAccess, ResourceDependency } from '@/src/models/dial/resource-dependency';
import ResourceDependencies from '../ResourceDependencies';

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getAdminConsentStatus: vi.fn(),
  grantAdminConsent: vi.fn(),
  withdrawAdminConsent: vi.fn(),
}));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn(() => false) }));

vi.mock('../DependenciesGrid', () => ({
  default: ({
    dependencies,
    onAdd,
    onEdit,
    onDuplicate,
    onRemove,
  }: {
    dependencies: ResourceDependency[];
    onAdd: () => void;
    onEdit: (dependency: ResourceDependency) => void;
    onDuplicate: (dependency: ResourceDependency) => void;
    onRemove: (dependency: ResourceDependency) => void;
  }) => (
    <div>
      <button onClick={onAdd}>add</button>
      {dependencies.map((dependency) => (
        <div key={dependency.link_id}>
          <span>{dependency.link_id}</span>
          <button onClick={() => onEdit(dependency)}>edit {dependency.link_id}</button>
          <button onClick={() => onDuplicate(dependency)}>duplicate {dependency.link_id}</button>
          <button onClick={() => onRemove(dependency)}>remove {dependency.link_id}</button>
        </div>
      ))}
    </div>
  ),
}));

const APP_PATH = 'public/team/assistant__1.0';

const makeDependency = (linkId: string, overrides: Partial<ResourceDependency> = {}): ResourceDependency => ({
  kind: 'dial.resourceLink',
  link_id: linkId,
  target: { path: `files/public/${linkId}/` },
  access: [ResourceAccess.Read],
  required: false,
  ...overrides,
});

const makeApplication = (dependencies?: ResourceDependency[]) =>
  ({ name: 'assistant', path: APP_PATH, resource_dependencies: dependencies }) as unknown as AssetApp;

const ok = (response: AdminConsentStatus) => ({ success: true, response });

describe('ResourceDependencies', () => {
  const user = userEvent.setup();
  const onChangeApplication = vi.fn();
  const { showNotification } = useNotification();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminConsentStatus).mockResolvedValue(ok({ consented: false }));
    vi.mocked(grantAdminConsent).mockResolvedValue({ success: true });
    vi.mocked(withdrawAdminConsent).mockResolvedValue({ success: true });
  });

  const renderTab = (
    saved: ResourceDependency[] | undefined,
    props?: { selected?: ResourceDependency[]; etag?: string },
  ) => {
    const original = makeApplication(saved);
    const element = (etag: string, selected = props?.selected ?? saved) => (
      <ResourceDependencies
        originalApplication={original}
        selectedApplication={{ ...original, resource_dependencies: selected } as DialApplication}
        etag={etag}
        onChangeApplication={onChangeApplication}
      />
    );
    const view = render(element(props?.etag ?? 'etag-1'));
    return { ...view, rerenderWithEtag: (etag: string) => view.rerender(element(etag)) };
  };

  const lastChange = () => onChangeApplication.mock.calls.at(-1)?.[0].resource_dependencies;
  const setText = (name: string, value: string) =>
    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(name) }), { target: { value } });

  describe('ResourceDependencies — consent status', () => {
    test('reads the status of the saved application path', async () => {
      renderTab([makeDependency('a')]);

      expect(await screen.findByText(ResourceDependenciesI18nKey.NotApproved)).toBeTruthy();
      expect(getAdminConsentStatus).toHaveBeenCalledWith(APP_PATH);
    });

    test('shows the no-data state instead of the tab when the status cannot be read', async () => {
      vi.mocked(getAdminConsentStatus).mockResolvedValue({ success: false, status: 403 });

      renderTab([makeDependency('a')]);

      expect(await screen.findByText(ResourceDependenciesI18nKey.ConsentUnavailable)).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'add' })).toBeNull();
      expect(screen.queryByText(ResourceDependenciesI18nKey.AdminConsent)).toBeNull();
    });

    test('keeps the grid usable while the status loads', () => {
      vi.mocked(getAdminConsentStatus).mockReturnValue(new Promise(() => {}));

      renderTab([makeDependency('a')]);

      expect(screen.getByRole('button', { name: 'add' })).toBeTruthy();
      expect(screen.getByLabelText(ResourceDependenciesI18nKey.ConsentLoading)).toBeTruthy();
    });

    test('re-reads the status when the saved etag changes', async () => {
      const { rerenderWithEtag } = renderTab([makeDependency('a')]);
      await screen.findByText(ResourceDependenciesI18nKey.NotApproved);

      rerenderWithEtag('etag-2');

      await vi.waitFor(() => expect(getAdminConsentStatus).toHaveBeenCalledTimes(2));
    });

    test('disables approving while the draft differs from the saved declaration', async () => {
      renderTab([makeDependency('a')], { selected: [makeDependency('a'), makeDependency('b')] });

      expect(await screen.findByRole('button', { name: ButtonsI18nKey.Approve })).toBeDisabled();
      expect(screen.getByText(ResourceDependenciesI18nKey.SavedDefinitionNote)).toBeTruthy();
    });
  });

  describe('ResourceDependencies — approve and revoke', () => {
    test('approving grants consent, notifies and re-reads the status', async () => {
      vi.mocked(getAdminConsentStatus)
        .mockResolvedValueOnce(ok({ consented: false }))
        .mockResolvedValueOnce(ok({ consented: true, grantedBy: 'admin', grantedResources: [] }));
      renderTab([makeDependency('a')]);

      await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Approve }));
      await user.click(screen.getAllByRole('button', { name: ButtonsI18nKey.Approve }).at(-1) as HTMLElement);

      expect(await screen.findByText(ResourceDependenciesI18nKey.Approved)).toBeTruthy();
      expect(grantAdminConsent).toHaveBeenCalledWith(APP_PATH);
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: ResourceDependenciesI18nKey.ApproveSuccess }),
      );
    });

    test('revoking withdraws consent and re-reads the status', async () => {
      vi.mocked(getAdminConsentStatus)
        .mockResolvedValueOnce(ok({ consented: true, grantedResources: [] }))
        .mockResolvedValueOnce(ok({ consented: false }));
      renderTab([makeDependency('a')]);

      await user.click(await screen.findByRole('button', { name: ResourceDependenciesI18nKey.Revoke }));
      await user.click(
        screen.getAllByRole('button', { name: ResourceDependenciesI18nKey.Revoke }).at(-1) as HTMLElement,
      );

      expect(await screen.findByRole('button', { name: ButtonsI18nKey.Approve })).toBeTruthy();
      expect(withdrawAdminConsent).toHaveBeenCalledWith(APP_PATH);
      expect(grantAdminConsent).not.toHaveBeenCalled();
    });

    test('reports Core’s message when approving fails', async () => {
      vi.mocked(grantAdminConsent).mockResolvedValue({
        success: false,
        status: 400,
        errorHeader: 'Bad request',
        errorMessage: 'Application declares no resource dependencies',
      });
      renderTab([makeDependency('a')]);

      await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Approve }));
      await user.click(screen.getAllByRole('button', { name: ButtonsI18nKey.Approve }).at(-1) as HTMLElement);

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(
          expect.objectContaining({ description: 'Application declares no resource dependencies' }),
        ),
      );
    });
  });

  describe('ResourceDependencies — editing the declaration', () => {
    test('adds a dependency to the draft in the persisted shape', async () => {
      renderTab([makeDependency('a')]);

      await user.click(await screen.findByRole('button', { name: 'add' }));
      setText(ResourceDependenciesI18nKey.LinkId, 'skills');
      setText(ResourceDependenciesI18nKey.TargetPath, 'skills/{current-user}/');
      await user.click(screen.getByRole('checkbox', { name: ResourceDependenciesI18nKey.Write }));
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

      expect(lastChange()).toEqual([
        makeDependency('a'),
        {
          kind: 'dial.resourceLink',
          link_id: 'skills',
          target: { path: 'skills/{current-user}/' },
          access: ['READ', 'WRITE'],
          required: false,
        },
      ]);
      expect(screen.queryByRole('textbox', { name: new RegExp(ResourceDependenciesI18nKey.LinkId) })).toBeNull();
    });

    test('refuses a link id that is already declared', async () => {
      renderTab([makeDependency('a')]);

      await user.click(await screen.findByRole('button', { name: 'add' }));
      setText(ResourceDependenciesI18nKey.LinkId, 'a');
      setText(ResourceDependenciesI18nKey.TargetPath, 'files/public/other/');

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeDisabled();
    });

    test('edits a dependency in place and lets it keep its own link id', async () => {
      renderTab([makeDependency('a'), makeDependency('b')]);

      await user.click(await screen.findByRole('button', { name: 'edit a' }));
      setText(ResourceDependenciesI18nKey.TargetPath, 'files/public/changed/');
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

      expect(lastChange()).toEqual([
        makeDependency('a', { target: { path: 'files/public/changed/' } }),
        makeDependency('b'),
      ]);
    });

    test('duplicates a dependency right below the source with a unique link id', async () => {
      renderTab([makeDependency('a'), makeDependency('b'), makeDependency('a_copy')]);

      await user.click(await screen.findByRole('button', { name: 'duplicate a' }));

      expect(lastChange().map((dependency: ResourceDependency) => dependency.link_id)).toEqual([
        'a',
        'a_copy2',
        'b',
        'a_copy',
      ]);
    });

    test('removes a dependency from the draft', async () => {
      renderTab([makeDependency('a'), makeDependency('b')]);

      await user.click(await screen.findByRole('button', { name: 'remove a' }));

      expect(lastChange()).toEqual([makeDependency('b')]);
    });

    test('drops the property once the last dependency is removed', async () => {
      renderTab([makeDependency('a')]);

      await user.click(await screen.findByRole('button', { name: 'remove a' }));

      expect(onChangeApplication).toHaveBeenCalledWith(expect.objectContaining({ resource_dependencies: undefined }));
    });
  });
});
