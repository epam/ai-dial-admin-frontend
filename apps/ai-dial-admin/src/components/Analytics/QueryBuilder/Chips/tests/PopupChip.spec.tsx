import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import PopupChip from '@/src/components/Analytics/QueryBuilder/Chips/PopupChip';

interface PanelOptions {
  prefix?: string;
  isApplyDisabled?: boolean;
  onApply?: () => void;
  onRemove?: () => void;
}

describe('PopupChip', () => {
  const renderChip = ({ prefix, isApplyDisabled = false, onApply = vi.fn(), onRemove }: PanelOptions = {}) =>
    render(
      <PopupChip
        prefix={prefix}
        label="25 rows"
        renderPanel={({ titleId, onClose }) => (
          <ChipPopupPanel
            titleId={titleId}
            title="Panel title"
            isApplyDisabled={isApplyDisabled}
            onApply={onApply}
            onCancel={onClose}
            onRemove={onRemove}
          >
            <p>Panel body</p>
          </ChipPopupPanel>
        )}
      />,
    );

  test('names the chip by its prefix and label', () => {
    renderChip({ prefix: 'Limit' });

    expect(screen.getByRole('button', { name: 'Limit 25 rows' })).toBeInTheDocument();
  });

  test('names a chip without a prefix by its label alone', () => {
    renderChip();

    expect(screen.getByRole('button', { name: '25 rows' })).toBeInTheDocument();
  });

  test('exposes a dialog popup and its expanded state', async () => {
    const user = userEvent.setup();
    renderChip();
    const chip = screen.getByRole('button', { name: '25 rows' });

    expect(chip).toHaveAttribute('aria-haspopup', 'dialog');
    expect(chip).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(chip);

    const dialog = await screen.findByRole('dialog', { name: 'Panel title' });
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getByRole('heading', { name: 'Panel title' })).toBeInTheDocument();
    expect(within(dialog).getByText('Panel body')).toBeInTheDocument();
  });

  test('closes on Cancel without applying', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderChip({ onApply });
    const chip = screen.getByRole('button', { name: '25 rows' });
    await user.click(chip);

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Buttons.Cancel' }));

    await waitFor(() => expect(chip).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
  });

  test('closes on Escape without applying', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderChip({ onApply });
    const chip = screen.getByRole('button', { name: '25 rows' });
    await user.click(chip);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(chip).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
  });

  test('applies from the panel', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderChip({ onApply });
    await user.click(screen.getByRole('button', { name: '25 rows' }));

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Buttons.Apply' }));

    expect(onApply).toHaveBeenCalledOnce();
  });

  test('blocks Apply while the panel is invalid', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderChip({ onApply, isApplyDisabled: true });
    await user.click(screen.getByRole('button', { name: '25 rows' }));
    const apply = within(await screen.findByRole('dialog')).getByRole('button', { name: 'Buttons.Apply' });

    expect(apply).toBeDisabled();
    await user.click(apply);

    expect(onApply).not.toHaveBeenCalled();
  });

  test('offers Remove only when the panel can remove its part, and never Back', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { unmount } = renderChip();
    await user.click(screen.getByRole('button', { name: '25 rows' }));
    const plain = await screen.findByRole('dialog');

    expect(within(plain).queryByRole('button', { name: 'Buttons.Remove' })).toBeNull();
    expect(within(plain).queryByRole('button', { name: 'Buttons.Back' })).toBeNull();

    unmount();
    renderChip({ onRemove });
    await user.click(screen.getByRole('button', { name: '25 rows' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Buttons.Remove' }));

    expect(onRemove).toHaveBeenCalledOnce();
  });
});
