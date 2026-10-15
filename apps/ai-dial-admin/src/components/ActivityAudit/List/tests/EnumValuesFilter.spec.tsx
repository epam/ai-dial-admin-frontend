import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomComponentContext, CustomFilterProps } from 'ag-grid-react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EnumValuesFilter from '@/src/components/ActivityAudit/List/EnumValuesFilter';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/activity-audit';
import { GridFilter } from '@/src/models/grid-filter';
import { GridFilterType } from '@/src/types/grid-filter';

type Props = CustomFilterProps<DialActivity, unknown, GridFilter>;

const VALUES = [
  { value: 'Table', label: 'Table' },
  { value: 'TableColumn', label: 'Table column' },
  { value: 'Pipeline', label: 'Pipeline' },
];

const onModelChange = vi.fn();
const onFilterChanged = vi.fn();

const renderFilter = (model: GridFilter | null = null) =>
  render(
    <CustomComponentContext.Provider value={{ setMethods: vi.fn() }}>
      <EnumValuesFilter
        {...({
          model,
          onModelChange,
          api: { onFilterChanged },
          colDef: { field: 'resourceType', headerName: 'Resource type' },
          values: VALUES,
        } as unknown as Props & { values: typeof VALUES })}
      />
    </CustomComponentContext.Provider>,
  );

const optionsGroup = () => screen.getByRole('group', { name: 'Resource type' });
const valueCheckbox = (label: string) => within(optionsGroup()).getByRole('checkbox', { name: label });
const selectAllCheckbox = () => screen.getByRole('checkbox', { name: BasicI18nKey.SelectAll });
const resetButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Reset });

const inModel = (filter: string): GridFilter => ({ filter, filterType: 'in', type: GridFilterType.INCLUDES });

describe('EnumValuesFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('lists every value it is given as a checkbox under its label', () => {
    renderFilter();

    expect(within(optionsGroup()).getAllByRole('checkbox')).toHaveLength(3);
    expect(valueCheckbox('Table column')).toBeInTheDocument();
  });

  test('picking a value drives an in model of the value, not the label', async () => {
    renderFilter();

    await userEvent.click(valueCheckbox('Table column'));

    expect(onModelChange).toHaveBeenCalledWith(inModel('TableColumn'));
  });

  test('picking a second value appends it to the selection', async () => {
    renderFilter(inModel('Table'));

    await userEvent.click(valueCheckbox('Pipeline'));

    expect(onModelChange).toHaveBeenCalledWith(inModel('Table,Pipeline'));
  });

  test('clearing the last value clears the model', async () => {
    renderFilter(inModel('Table'));

    await userEvent.click(valueCheckbox('Table'));

    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('marks the values of the model as checked and Select All as partial', () => {
    renderFilter(inModel('Table,Pipeline'));

    expect(valueCheckbox('Table')).toBeChecked();
    expect(valueCheckbox('Table column')).not.toBeChecked();
    expect(selectAllCheckbox()).not.toBeChecked();
  });

  test('Select All picks every value, and clears them once they are all picked', async () => {
    const { unmount } = renderFilter();
    await userEvent.click(selectAllCheckbox());
    expect(onModelChange).toHaveBeenLastCalledWith(inModel('Table,TableColumn,Pipeline'));
    unmount();

    renderFilter(inModel('Table,TableColumn,Pipeline'));
    await userEvent.click(selectAllCheckbox());
    expect(onModelChange).toHaveBeenLastCalledWith(null);
  });

  test('Reset is disabled until a value is picked, then clears the model', async () => {
    const { unmount } = renderFilter();
    expect(resetButton()).toBeDisabled();
    unmount();

    renderFilter(inModel('Table'));
    await userEvent.click(resetButton());
    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('tells the grid the filter changed once the model changes after the first render', () => {
    const { rerender } = renderFilter(inModel('Table'));
    expect(onFilterChanged).not.toHaveBeenCalled();

    rerender(
      <CustomComponentContext.Provider value={{ setMethods: vi.fn() }}>
        <EnumValuesFilter
          {...({
            model: inModel('Table,Pipeline'),
            onModelChange,
            api: { onFilterChanged },
            colDef: { field: 'resourceType', headerName: 'Resource type' },
            values: VALUES,
          } as unknown as Props & { values: typeof VALUES })}
        />
      </CustomComponentContext.Provider>,
    );

    expect(onFilterChanged).toHaveBeenCalledOnce();
  });
});
