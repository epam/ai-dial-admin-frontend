import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import AddApplicationsPopup from '../AddApplicationsPopup';

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  AppsFolderProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stand-in for the applications tree: reports a selection through the multi-select callback.
vi.mock('@/src/components/Common/EntitySelectInput/EntitySelectManager', () => ({
  default: ({ onChangeSelectedPaths }: { onChangeSelectedPaths?: (paths: string[]) => void }) => (
    <div>
      <button onClick={() => onChangeSelectedPaths?.(['public/a/1.0', 'platform/b'])}>select-two</button>
      <button onClick={() => onChangeSelectedPaths?.([])}>select-none</button>
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

  test('shows the applications tree under the add-applications header when open', () => {
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

  test('hands the selected paths to onApply', async () => {
    const user = userEvent.setup();
    renderPopup();

    await user.click(screen.getByRole('button', { name: 'select-two' }));
    await user.click(applyButton());

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(['public/a/1.0', 'platform/b']);
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
