import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  createOrgUnit,
  deleteOrgUnit,
  removeFolderMarkers,
  renameOrgUnit,
} from '@/src/app/[lang]/folders-storage/actions';
import { ButtonsI18nKey, ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { OrgUnit } from '@/src/models/dial/org-unit';
import NewUnitModal from '../Modals/NewUnitModal';
import RemoveUnitModal from '../Modals/RemoveUnitModal';
import RenameUnitModal from '../Modals/RenameUnitModal';

vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({
  createOrgUnit: vi.fn(),
  renameOrgUnit: vi.fn(),
  deleteOrgUnit: vi.fn(),
  removeFolderMarkers: vi.fn(),
}));

const unit: OrgUnit = {
  id: 'u1',
  name: 'Risk',
  displayName: 'Risk',
  path: 'public/Acme/Risk',
  folder: 'public/Acme/Risk/',
};

const enterName = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  // The popup's focus manager moves focus once after mount, which swallows the first interaction.
  await user.click(await screen.findByRole('dialog'));
  await user.click(screen.getByRole('textbox', { name: new RegExp(FoldersI18nKey.UnitName) }));
  await user.paste(value);
};

describe('NewUnitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (onCreated = vi.fn()) =>
    render(<NewUnitModal parentPath="public/Acme" onClose={vi.fn()} onCreated={onCreated} />);

  test('keeps Create disabled until a name is entered', () => {
    renderModal();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });

  test('creates under the parent with only the name when no display name is given', async () => {
    const user = userEvent.setup();
    const created = { ...unit, name: 'US Risk' };
    vi.mocked(createOrgUnit).mockResolvedValue({ success: true, response: created });
    const onCreated = vi.fn();
    renderModal(onCreated);

    await enterName(user, 'USRisk');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(createOrgUnit).toHaveBeenCalledWith('public/Acme', { name: 'USRisk' });
  });

  test.each([
    [400, '"roles" is reserved. Choose another name.', '"roles" is reserved. Choose another name.'],
    [409, 'public/Acme already has a unit named roles', FoldersI18nKey.UnitNameExists],
  ])('shows the %s error next to the name and stays open', async (status, errorMessage, message) => {
    const user = userEvent.setup();
    vi.mocked(createOrgUnit).mockResolvedValue({ success: false, status, errorMessage });
    const onCreated = vi.fn();
    renderModal(onCreated);

    await enterName(user, 'roles');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  test('disables Create for a too long display name', async () => {
    const user = userEvent.setup();
    renderModal();

    await enterName(user, 'x');
    await user.click(screen.getByRole('textbox', { name: FoldersI18nKey.UnitDisplayName }));
    await user.paste('a'.repeat(129));

    expect(await screen.findByText(FoldersI18nKey.UnitDisplayNameTooLong)).toBeTruthy();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });
});

describe('RenameUnitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('sends only the display name', async () => {
    const user = userEvent.setup();
    const renamed = { ...unit, displayName: 'Risk Department' };
    vi.mocked(renameOrgUnit).mockResolvedValue({ success: true, response: renamed });
    const onRenamed = vi.fn();
    render(<RenameUnitModal unit={unit} onClose={vi.fn()} onRenamed={onRenamed} />);

    await user.click(await screen.findByRole('dialog'));
    const input = screen.getByRole('textbox', { name: FoldersI18nKey.UnitDisplayName });
    await user.click(input);
    await user.clear(input);
    await user.paste('Risk Department');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(onRenamed).toHaveBeenCalledOnce());
    expect(renameOrgUnit).toHaveBeenCalledWith('public/Acme/Risk', 'Risk Department');
  });
});

describe('RemoveUnitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const subUnits: OrgUnit[] = [
    { ...unit, id: 's1', name: 'US Risk' },
    { ...unit, id: 's2', name: 'EU Risk' },
  ];

  test('shows the unit name, and the display name only when it is set', () => {
    render(
      <RemoveUnitModal
        unit={{ ...unit, displayName: '' }}
        subUnits={[{ ...unit, id: 's3', name: 'EU', displayName: '' }]}
        onClose={vi.fn()}
        onRemoved={vi.fn()}
      />,
    );

    expect(screen.getByText(FoldersI18nKey.RemoveUnitDescription)).toBeTruthy();
    expect(screen.getByText(unit.name)).toBeTruthy();
    expect(screen.queryByText(FoldersI18nKey.UnitDisplayName + ':')).toBeNull();
    expect(screen.getByText('EU')).toBeTruthy();
  });

  test('lists the sub-units and sends one recursive delete', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockResolvedValue({ success: true });
    const onRemoved = vi.fn();
    render(<RemoveUnitModal unit={unit} subUnits={subUnits} onClose={vi.fn()} onRemoved={onRemoved} />);

    expect(screen.getByText('US Risk')).toBeTruthy();
    expect(screen.getByText('EU Risk')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    await vi.waitFor(() => expect(onRemoved).toHaveBeenCalledOnce());
    expect(deleteOrgUnit).toHaveBeenCalledOnce();
    expect(deleteOrgUnit).toHaveBeenCalledWith('public/Acme/Risk', true);
  });

  test('lists item names in red-labelled sections and offers only Close when the unit still holds content', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockResolvedValue({
      success: false,
      status: 409,
      errorMessage:
        'public/Acme still holds content: applications/public/Acme/sla-app__1.0.0, files/public/Acme/.dial_folder, files/public/Acme/q3.xlsx. Delete or move it first.',
    });
    vi.mocked(removeFolderMarkers).mockResolvedValue({ success: false });
    const onClose = vi.fn();
    const onRemoved = vi.fn();
    render(<RemoveUnitModal unit={unit} subUnits={[]} onClose={onClose} onRemoved={onRemoved} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    expect(await screen.findByText(FoldersI18nKey.RemoveUnitHoldsContent)).toBeTruthy();
    expect(screen.getByText(FoldersI18nKey.RemoveUnitDescription)).toBeTruthy();
    expect(screen.getByText(FoldersI18nKey.RemoveUnitDeleteOrMove)).toBeTruthy();
    expect(screen.getByText('sla-app__1.0.0')).toBeTruthy();
    expect(screen.getByText('q3.xlsx')).toBeTruthy();
    expect(screen.queryByText('.dial_folder')).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Remove })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Cancel })).toBeNull();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));
    expect(onClose).toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
  });

  test('removes the .dial_folder markers core reports and retries when nothing else is left', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit)
      .mockResolvedValueOnce({
        success: false,
        status: 409,
        errorMessage: 'public/Acme still holds content: files/public/Acme/.dial_folder. Delete or move it first.',
      })
      .mockResolvedValueOnce({ success: true });
    vi.mocked(removeFolderMarkers).mockResolvedValue({ success: true });
    const onRemoved = vi.fn();
    render(<RemoveUnitModal unit={unit} subUnits={[]} onClose={vi.fn()} onRemoved={onRemoved} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    await vi.waitFor(() => expect(onRemoved).toHaveBeenCalledOnce());
    expect(removeFolderMarkers).toHaveBeenCalledWith(['public/Acme/.dial_folder']);
    expect(deleteOrgUnit).toHaveBeenCalledTimes(2);
  });

  test('shows any other core refusal as an alert and keeps the dialog actionable', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockResolvedValue({ success: false, status: 409, errorMessage: 'Unit is busy' });
    render(<RemoveUnitModal unit={unit} subUnits={[]} onClose={vi.fn()} onRemoved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    expect((await screen.findByRole('alert')).textContent).toContain('Unit is busy');
  });
});

describe('Unit dialogs recover from a thrown server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('NewUnitModal re-enables Create after the action throws', async () => {
    const user = userEvent.setup();
    vi.mocked(createOrgUnit).mockRejectedValue(new Error('network'));
    render(<NewUnitModal parentPath="public/Acme" onClose={vi.fn()} onCreated={vi.fn()} />);

    await enterName(user, 'Risk');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeEnabled());
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.SystemUnavailable }),
    );
  });

  test('RenameUnitModal re-enables Save after the action throws', async () => {
    const user = userEvent.setup();
    vi.mocked(renameOrgUnit).mockRejectedValue(new Error('network'));
    render(<RenameUnitModal unit={unit} onClose={vi.fn()} onRenamed={vi.fn()} />);

    await user.click(await screen.findByRole('dialog'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled());
  });

  test('RemoveUnitModal re-enables Remove after the action throws', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockRejectedValue(new Error('network'));
    render(<RemoveUnitModal unit={unit} subUnits={[]} onClose={vi.fn()} onRemoved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    await vi.waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Remove })).toBeEnabled());
  });
});
