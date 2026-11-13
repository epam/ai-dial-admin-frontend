import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { PickedEntity } from '@/src/components/Common/EntitySelectInput/models';
import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { AssetSource } from '@/src/models/dial/asset-source';
import AddApplicationsPopup from '../AddApplicationsPopup';

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  AppsFolderProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const PICKED: PickedEntity[] = [
  { source: AssetSource.Public, name: 'public/a/1.0', path: 'public/a/1.0' },
  { source: AssetSource.Platform, name: 'b' },
];

// Stand-in for the tabbed picker: reports a selection through the multi-source callback.
vi.mock('@/src/components/Common/EntitySelectInput/EntitySelectManager', () => ({
  default: ({ onChangeSelectedEntities }: { onChangeSelectedEntities?: (entities: PickedEntity[]) => void }) => (
    <div>
      <button onClick={() => onChangeSelectedEntities?.(PICKED)}>select-two</button>
      <button onClick={() => onChangeSelectedEntities?.([])}>select-none</button>
    </div>
  ),
}));

describe('AddApplicationsPopup', () => {
  const onClose = vi.fn();
  const onApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPopup = (isOpen = true) =>
    render(<AddApplicationsPopup isOpen={isOpen} onClose={onClose} onApply={onApply} />);

  const applyButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Apply });

  test('shows the applications picker under the add-applications header when open', () => {
    renderPopup();

    expect(screen.getByText(RolesI18nKey.AddApplications)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'select-two' })).toBeTruthy();
  });

  test('renders nothing when closed', () => {
    renderPopup(false);

    expect(screen.queryByText(RolesI18nKey.AddApplications)).toBeNull();
  });

  test('keeps Apply disabled until an application is selected', async () => {
    const user = userEvent.setup();
    renderPopup();

    expect(applyButton().hasAttribute('disabled')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'select-two' }));
    expect(applyButton().hasAttribute('disabled')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'select-none' }));
    expect(applyButton().hasAttribute('disabled')).toBe(true);
  });

  test('hands the selected entities, with their sources, to onApply', async () => {
    const user = userEvent.setup();
    renderPopup();

    await user.click(screen.getByRole('button', { name: 'select-two' }));
    await user.click(applyButton());

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(PICKED);
  });

  test('discards the pick on cancel so the next open starts empty', async () => {
    const user = userEvent.setup();
    renderPopup();

    await user.click(screen.getByRole('button', { name: 'select-two' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(applyButton().hasAttribute('disabled')).toBe(true);
  });
});
