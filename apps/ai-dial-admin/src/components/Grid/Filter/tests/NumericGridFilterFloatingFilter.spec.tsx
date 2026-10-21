import { createRef } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IFloatingFilterParent, IFloatingFilterParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import NumericGridFilterFloatingFilter from '@/src/components/Grid/Filter/NumericGridFilterFloatingFilter';
import { GridFilterType } from '@/src/types/grid-filter';

// The component takes ag-grid's whole floating-filter params; these cases only vary two of them, so
// the rest come from one typed fake.
const makeProps = (overrides: Partial<IFloatingFilterParams> = {}): IFloatingFilterParams => ({
  ...({} as IFloatingFilterParams),
  currentParentModel: () => null,
  parentFilterInstance: vi.fn<IFloatingFilterParams['parentFilterInstance']>(),
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
    // ag-grid hands the callback its own parent type, so the fake takes the signature from the params.
    const parentFilterInstance: IFloatingFilterParams['parentFilterInstance'] = (callback) =>
      callback({ onFloatingFilterChanged } as unknown as Parameters<typeof callback>[0]);

    render(<NumericGridFilterFloatingFilter {...makeProps({ parentFilterInstance })} />);

    await user.click(screen.getByTitle('Grid.Filter'));
    await user.type(await screen.findByPlaceholderText('Grid.FilterValue'), '5');

    expect(onFloatingFilterChanged).toHaveBeenLastCalledWith(GridFilterType.GREATER_THAN, 5);
  });

  test('calls onFloatingFilterChanged with null when reset', async () => {
    const user = userEvent.setup();
    const onFloatingFilterChanged = vi.fn();
    // ag-grid hands the callback its own parent type, so the fake takes the signature from the params.
    const parentFilterInstance: IFloatingFilterParams['parentFilterInstance'] = (callback) =>
      callback({ onFloatingFilterChanged } as unknown as Parameters<typeof callback>[0]);

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
