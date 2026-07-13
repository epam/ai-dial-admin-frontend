import { createRef } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IFloatingFilterParent } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import NumericGridFilterFloatingFilter from '@/src/components/Grid/Filter/NumericGridFilterFloatingFilter';
import { GridFilterType } from '@/src/types/grid-filter';

const makeProps = (
  overrides: Partial<{
    currentParentModel: () => unknown;
    parentFilterInstance: (callback: (instance: IFloatingFilterParent) => void) => void;
  }> = {},
) => ({
  currentParentModel: () => null,
  parentFilterInstance: vi.fn(),
  column: {} as never,
  filterParams: {},
  showParentFilter: vi.fn(),
  ...overrides,
});

describe('NumericGridFilterFloatingFilter', () => {
  test('renders filter button with i18n title', () => {
    render(<NumericGridFilterFloatingFilter {...makeProps()} />);

    expect(screen.getByTitle('Grid.Filter')).toBeInTheDocument();
  });

  test('syncs active state from parent model', () => {
    const ref = createRef<{ onParentModelChanged: (model: unknown) => void }>();

    render(
      <NumericGridFilterFloatingFilter
        {...makeProps({
          currentParentModel: () => ({ type: GridFilterType.GREATER_THAN, filter: 5 }),
        })}
        ref={ref}
      />,
    );

    expect(screen.getByTitle('Grid.Filter').className).toContain('text-accent-primary');
  });

  test('calls onFloatingFilterChanged when a value is applied', async () => {
    const user = userEvent.setup();
    const onFloatingFilterChanged = vi.fn();
    const parentFilterInstance = vi.fn((callback: (instance: IFloatingFilterParent) => void) => {
      callback({ onFloatingFilterChanged } as IFloatingFilterParent);
    });

    render(<NumericGridFilterFloatingFilter {...makeProps({ parentFilterInstance })} />);

    await user.click(screen.getByTitle('Grid.Filter'));
    await user.type(await screen.findByPlaceholderText('Grid.FilterValue'), '5');

    expect(onFloatingFilterChanged).toHaveBeenLastCalledWith(GridFilterType.GREATER_THAN, 5);
  });

  test('calls onFloatingFilterChanged with null when reset', async () => {
    const user = userEvent.setup();
    const onFloatingFilterChanged = vi.fn();
    const parentFilterInstance = vi.fn((callback: (instance: IFloatingFilterParent) => void) => {
      callback({ onFloatingFilterChanged } as IFloatingFilterParent);
    });

    render(
      <NumericGridFilterFloatingFilter
        {...makeProps({
          currentParentModel: () => ({ type: GridFilterType.GREATER_THAN, filter: 5 }),
          parentFilterInstance,
        })}
      />,
    );

    await user.click(screen.getByTitle('Grid.Filter'));
    await user.click(await screen.findByRole('button', { name: 'Buttons.Reset' }));

    expect(onFloatingFilterChanged).toHaveBeenCalledWith(null, null);
  });
});
