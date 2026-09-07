import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import ActionColumn from '../ActionColumn';

describe('ActionColumn', () => {
  const baseProps = {
    items: [
      { id: 'edit', label: 'edit-label', hidden: undefined },
      { id: 'delete', label: 'delete-label', hidden: () => false },
      { id: 'hidden', label: 'hidden-label', hidden: () => true },
    ],
    data: { name: 'entity1' },
    api: {},
    node: { rowIndex: 2 },
  };

  test('renders the action menu trigger as a named button', () => {
    render(<ActionColumn {...baseProps} />);

    const trigger = screen.getByRole('button', { name: ButtonsI18nKey.Actions });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens the menu with the visible items and marks the trigger expanded', async () => {
    const user = userEvent.setup();
    render(<ActionColumn {...baseProps} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Actions })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'edit-label' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'delete-label' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'hidden-label' })).not.toBeInTheDocument();
  });

  test('opens the menu from the keyboard', async () => {
    const user = userEvent.setup();
    render(<ActionColumn {...baseProps} />);

    await user.tab();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Actions })).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(screen.getByRole('menuitem', { name: 'edit-label' })).toBeInTheDocument();
  });

  test('invokes the chosen operation with the row data and index', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ActionColumn {...baseProps} items={[{ id: 'edit', label: 'edit-label', hidden: undefined, onClick }]} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByRole('menuitem', { name: 'edit-label' }));

    expect(onClick).toHaveBeenCalledWith(baseProps.data, baseProps.node.rowIndex);
  });

  test('renders nothing if data is null', () => {
    render(<ActionColumn {...baseProps} data={null} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Actions })).not.toBeInTheDocument();
  });
});
