import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { CustomCellRendererProps } from 'ag-grid-react';

import ActionColumn from '../ActionColumn';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';

type Row = { name: string };

const ROW: Row = { name: 'entity1' };
const ROW_INDEX = 2;

const operation = (
  overrides: Partial<ActionMenuOperationDeclaration<Row>> = {},
): ActionMenuOperationDeclaration<Row> => ({
  // Deliberately empty: ui-kit renders an item's icon inside the menuitem's label, so an icon with
  // text of its own would land in the accessible name these tests query by.
  icon: null,
  id: 'edit',
  label: 'edit-label',
  onClick: vi.fn(),
  ...overrides,
});

const operations = (): ActionMenuOperationDeclaration<Row>[] => [
  operation(),
  operation({ id: 'delete', label: 'delete-label', hidden: () => false }),
  operation({ id: 'hidden', label: 'hidden-label', hidden: () => true }),
];

// AG Grid mounts a renderer with the full cell-renderer params; the cast keeps this spec to the few
// that ActionColumn actually reads, and lets the no-data case pass `null` the way the grid does.
const renderColumn = (items = operations(), data: Row | null = ROW) =>
  render(
    <ActionColumn
      {...({ items, data, api: {}, node: { rowIndex: ROW_INDEX } } as unknown as CustomCellRendererProps<Row> & {
        items: ActionMenuOperationDeclaration<Row>[];
      })}
    />,
  );

const getTrigger = () => screen.getByRole('button', { name: ButtonsI18nKey.Actions });

describe('ActionColumn', () => {
  test('renders the action menu trigger as a named button', () => {
    renderColumn();

    const trigger = getTrigger();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('opens the menu with the visible items and marks the trigger expanded', async () => {
    const user = userEvent.setup();
    renderColumn();

    await user.click(getTrigger());

    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menuitem', { name: 'edit-label' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'delete-label' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'hidden-label' })).toBeNull();
  });

  test('opens the menu from the keyboard', async () => {
    const user = userEvent.setup();
    renderColumn();

    await user.tab();
    expect(document.activeElement).toBe(getTrigger());

    await user.keyboard('{Enter}');

    expect(screen.getByRole('menuitem', { name: 'edit-label' })).toBeTruthy();
  });

  test('invokes the chosen operation with the row data and index', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderColumn([operation({ onClick })]);

    await user.click(getTrigger());
    await user.click(screen.getByRole('menuitem', { name: 'edit-label' }));

    expect(onClick).toHaveBeenCalledWith(ROW, ROW_INDEX);
  });

  test('renders nothing when the row has no data', () => {
    renderColumn(operations(), null);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Actions })).toBeNull();
  });
});
