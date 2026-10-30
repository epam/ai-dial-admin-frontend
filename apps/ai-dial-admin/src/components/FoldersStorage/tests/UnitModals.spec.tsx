import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createOrgUnit, deleteOrgUnit, renameOrgUnit } from '@/src/app/[lang]/folders-storage/actions';
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
}));

const unit: OrgUnit = {
  id: 'u1',
  name: 'Risk',
  displayName: 'Risk',
  path: 'public/Acme/Risk',
  folder: 'public/Acme/Risk/',
};

const enterText = (name: string | RegExp, value: string) => {
  // These tests exercise form values, not clipboard behavior. Target the native input so the popup's
  // delayed focus management cannot redirect a paste to another element.
  const input = screen.getByRole('textbox', { name });
  fireEvent.change(input, { target: { value } });
  expect(input).toHaveValue(value);
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

    enterText(new RegExp(FoldersI18nKey.UnitName), 'USRisk');
    const createButton = screen.getByRole('button', { name: ButtonsI18nKey.Create });
    await user.click(createButton);

    await waitFor(() => expect(createButton).toBeEnabled());
    expect(createOrgUnit).toHaveBeenCalledWith('public/Acme', { name: 'USRisk' });
    expect(onCreated).toHaveBeenCalledWith(created);
  });

  test.each([
    [400, '"roles" is reserved. Choose another name.'],
    [409, 'public/Acme already has a folder named Policies. Choose another name.'],
  ])('shows core %s message next to the name and stays open', async (status, message) => {
    const user = userEvent.setup();
    vi.mocked(createOrgUnit).mockResolvedValue({ success: false, status, errorMessage: message });
    const onCreated = vi.fn();
    renderModal(onCreated);

    enterText(new RegExp(FoldersI18nKey.UnitName), 'roles');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  test('disables Create for a too long display name', async () => {
    renderModal();

    enterText(new RegExp(FoldersI18nKey.UnitName), 'x');
    enterText(FoldersI18nKey.UnitDisplayName, 'a'.repeat(129));

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

    enterText(FoldersI18nKey.UnitDisplayName, 'Risk Department');
    const saveButton = screen.getByRole('button', { name: ButtonsI18nKey.Save });
    await user.click(saveButton);

    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(renameOrgUnit).toHaveBeenCalledWith('public/Acme/Risk', 'Risk Department');
    expect(onRenamed).toHaveBeenCalledOnce();
  });
});

describe('RemoveUnitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const subUnits: OrgUnit[] = [
    { ...unit, id: 's1', displayName: 'US Risk' },
    { ...unit, id: 's2', displayName: 'EU Risk' },
  ];

  test('falls back to the unit name when there is no display name', () => {
    render(
      <RemoveUnitModal
        unit={{ ...unit, displayName: '' }}
        subUnits={[{ ...unit, id: 's3', name: 'EU', displayName: '' }]}
        onClose={vi.fn()}
        onRemoved={vi.fn()}
      />,
    );

    expect(screen.getByText(FoldersI18nKey.RemoveUnitDescription)).toBeTruthy();
    expect(screen.getByText('EU')).toBeTruthy();
  });

  test('lists the sub-units and sends one recursive delete', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockResolvedValue({ success: true });
    const onRemoved = vi.fn();
    render(<RemoveUnitModal unit={unit} subUnits={subUnits} onClose={vi.fn()} onRemoved={onRemoved} />);

    expect(screen.getByText('US Risk')).toBeTruthy();
    expect(screen.getByText('EU Risk')).toBeTruthy();

    const removeButton = screen.getByRole('button', { name: ButtonsI18nKey.Remove });
    await user.click(removeButton);

    await waitFor(() => expect(removeButton).toBeEnabled());
    expect(deleteOrgUnit).toHaveBeenCalledOnce();
    expect(deleteOrgUnit).toHaveBeenCalledWith('public/Acme/Risk', true);
    expect(onRemoved).toHaveBeenCalledOnce();
  });

  test('stays open and shows core message when the unit still holds content', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockResolvedValue({
      success: false,
      status: 409,
      errorMessage: 'Unit holds Reports/q3.xlsx',
    });
    const onRemoved = vi.fn();
    render(<RemoveUnitModal unit={unit} subUnits={[]} onClose={vi.fn()} onRemoved={onRemoved} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    expect((await screen.findByRole('alert')).textContent).toContain('Reports/q3.xlsx');
    expect(onRemoved).not.toHaveBeenCalled();
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

    enterText(new RegExp(FoldersI18nKey.UnitName), 'Risk');
    const createButton = screen.getByRole('button', { name: ButtonsI18nKey.Create });
    await user.click(createButton);

    await waitFor(() => expect(createButton).toBeEnabled());
    expect(createOrgUnit).toHaveBeenCalledWith('public/Acme', { name: 'Risk' });
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.SystemUnavailable }),
    );
  });

  test('RenameUnitModal re-enables Save after the action throws', async () => {
    const user = userEvent.setup();
    vi.mocked(renameOrgUnit).mockRejectedValue(new Error('network'));
    render(<RenameUnitModal unit={unit} onClose={vi.fn()} onRenamed={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: ButtonsI18nKey.Save });
    await user.click(saveButton);

    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(renameOrgUnit).toHaveBeenCalledWith(unit.path, unit.displayName);
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.SystemUnavailable }),
    );
  });

  test('RemoveUnitModal re-enables Remove after the action throws', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteOrgUnit).mockRejectedValue(new Error('network'));
    render(<RemoveUnitModal unit={unit} subUnits={[]} onClose={vi.fn()} onRemoved={vi.fn()} />);

    const removeButton = screen.getByRole('button', { name: ButtonsI18nKey.Remove });
    await user.click(removeButton);

    await waitFor(() => expect(removeButton).toBeEnabled());
    expect(deleteOrgUnit).toHaveBeenCalledWith(unit.path, true);
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.SystemUnavailable }),
    );
  });
});
