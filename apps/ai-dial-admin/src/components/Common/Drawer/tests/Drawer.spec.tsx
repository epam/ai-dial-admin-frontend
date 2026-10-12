import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import Drawer from '@/src/components/Common/Drawer/Drawer';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const renderDrawer = (props: Partial<React.ComponentProps<typeof Drawer>> = {}) =>
  render(
    <>
      <button>behind</button>
      <Drawer isOpen ariaLabel="Edit role" header={<span>drawer-title</span>} onClose={vi.fn()} {...props}>
        <input aria-label="field" />
        <button aria-haspopup="listbox" aria-expanded="true">
          open-list
        </button>
        <button aria-haspopup="listbox" aria-expanded="false">
          closed-list
        </button>
      </Drawer>
    </>,
  );

describe('Drawer', () => {
  test('renders nothing while closed', () => {
    renderDrawer({ isOpen: false });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('renders a dialog named by its aria label with the header, body and footer slots', () => {
    renderDrawer({ footer: <button>drawer-save</button> });

    expect(screen.getByRole('dialog', { name: 'Edit role' })).toBeInTheDocument();
    expect(screen.getByText('drawer-title')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'field' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'drawer-save' })).toBeInTheDocument();
  });

  test('renders no footer when none is given', () => {
    renderDrawer();

    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  test('closes through its close control', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer({ onClose });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer({ onClose });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('does not close on the Escape that dismisses an open popup inside it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer({ onClose });
    const trigger = screen.getByRole('button', { name: 'open-list' });

    trigger.focus();
    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  test('closes on Escape from a control whose popup is closed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer({ onClose });

    screen.getByRole('button', { name: 'closed-list' }).focus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('does not close on a click outside, so typed input is not discarded by accident', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer({ onClose });

    await user.click(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });

  test('moves focus into the dialog on open', async () => {
    renderDrawer();

    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
  });

  test('makes the page behind it inert', () => {
    renderDrawer();

    expect(screen.queryByRole('button', { name: 'behind' })).toBeNull();
  });
});
