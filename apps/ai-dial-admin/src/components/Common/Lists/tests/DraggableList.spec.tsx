import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, expect, test, vi } from 'vitest';

import DraggableList from '@/src/components/Common/Lists/DraggableList';

const ITEMS = ['alpha', 'beta', 'gamma'];

const withDnd = (children: ReactNode) => <DndProvider backend={HTML5Backend}>{children}</DndProvider>;

const renderList = (props?: Partial<Parameters<typeof DraggableList>[0]>) => {
  const setItems = vi.fn();
  const view = render(withDnd(<DraggableList items={ITEMS} setItems={setItems} {...props} />));
  return { setItems, view };
};

// The rows are text inputs; their order is the authored order.
const rowValues = () => screen.getAllByRole('textbox').map((el) => (el as HTMLInputElement).value);

describe('DraggableList', () => {
  test('publishes the authored list upward', () => {
    const { setItems } = renderList();
    expect(setItems).toHaveBeenLastCalledWith(ITEMS);
  });

  test('renders one editable row per item', () => {
    renderList();
    expect(rowValues()).toEqual(ITEMS);
  });

  describe('while a search term is active', () => {
    // The filter used to replace the authored list with the matching subset, and the modal applies whatever
    // was published — so applying with a term typed committed only the matches and dropped everything else.
    test('still publishes every authored item, not just the matches', () => {
      const { setItems } = renderList({ filter: 'alpha' });

      expect(rowValues()).toEqual(['alpha']);
      expect(setItems).toHaveBeenLastCalledWith(ITEMS);
    });

    test('editing a visible row patches that item and keeps the hidden ones', async () => {
      const user = userEvent.setup();
      const { setItems } = renderList({ filter: 'gamma' });

      expect(rowValues()).toEqual(['gamma']);
      await user.type(screen.getByRole('textbox'), '!');

      await waitFor(() => expect(setItems).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma!']));
    });

    test('removing a visible row removes that item and keeps the hidden ones', async () => {
      const user = userEvent.setup();
      const { setItems } = renderList({ filter: 'beta' });

      expect(rowValues()).toEqual(['beta']);
      await user.click(screen.getByRole('button'));

      await waitFor(() => expect(setItems).toHaveBeenLastCalledWith(['alpha', 'gamma']));
    });

    test('clearing the term brings the hidden rows back', () => {
      const { view } = renderList({ filter: 'alpha' });
      expect(rowValues()).toEqual(['alpha']);

      view.rerender(withDnd(<DraggableList items={ITEMS} setItems={vi.fn()} filter="" />));

      expect(rowValues()).toEqual(ITEMS);
    });
  });

  test('adds an empty row through the add action', async () => {
    const user = userEvent.setup();
    const { setItems } = renderList({ addTitle: 'Add value' });

    await user.click(screen.getByRole('button', { name: 'Add value' }));

    await waitFor(() => expect(setItems).toHaveBeenLastCalledWith([...ITEMS, '']));
  });
});
