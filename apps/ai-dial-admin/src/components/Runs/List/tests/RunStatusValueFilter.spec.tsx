import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomComponentContext, CustomFilterProps } from 'ag-grid-react';
import { describe, expect, test, vi } from 'vitest';

import RunStatusValueFilter from '@/src/components/Runs/List/RunStatusValueFilter';
import { BasicI18nKey, ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { GridFilter } from '@/src/models/grid-filter';
import { GridFilterType } from '@/src/types/grid-filter';

type Props = CustomFilterProps<Run, unknown, GridFilter>;

const onModelChange = vi.fn();

// The grid normally retrieves `doesFilterPass` through this context to decide, row by row, whether a
// row passes — standing in for it is what lets the test exercise that callback directly.
let doesFilterPass: ((params: { data: Run }) => boolean) | undefined;

const renderFilter = (model: GridFilter | null = null) =>
  render(
    <CustomComponentContext.Provider
      value={{
        setMethods: (methods) => {
          doesFilterPass = (methods as { doesFilterPass?: typeof doesFilterPass }).doesFilterPass;
        },
      }}
    >
      <RunStatusValueFilter {...({ model, onModelChange } as unknown as Props)} />
    </CustomComponentContext.Provider>,
  );

const optionsGroup = () => screen.getByRole('group', { name: RunsI18nKey.StatusFilterGroup });
const statusCheckbox = (status: RunsI18nKey) => within(optionsGroup()).getByRole('checkbox', { name: status });
const selectAllCheckbox = () => screen.getByRole('checkbox', { name: BasicI18nKey.SelectAll });
const resetButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Reset });

const runWithStatus = (status: RunStatus) => ({ status }) as Run;

describe('RunStatusValueFilter', () => {
  test('lists every fixed status as a checkbox, labelled by its own status wording', () => {
    renderFilter();

    expect(statusCheckbox(RunsI18nKey.Pending)).toBeInTheDocument();
    expect(statusCheckbox(RunsI18nKey.Completed)).toBeInTheDocument();
    expect(statusCheckbox(RunsI18nKey.Running)).toBeInTheDocument();
    expect(statusCheckbox(RunsI18nKey.Failed)).toBeInTheDocument();
    expect(statusCheckbox(RunsI18nKey.Cancelling)).toBeInTheDocument();
    expect(statusCheckbox(RunsI18nKey.Cancelled)).toBeInTheDocument();
    expect(within(optionsGroup()).getAllByRole('checkbox')).toHaveLength(6);
  });

  test('selecting a status drives the model', async () => {
    renderFilter();

    await userEvent.click(statusCheckbox(RunsI18nKey.Failed));

    expect(onModelChange).toHaveBeenCalledWith({
      filter: RunStatus.FAILED,
      filterType: 'in',
      type: GridFilterType.INCLUDES,
    });
  });

  test('adding a second status keeps the first', async () => {
    renderFilter({ filter: RunStatus.FAILED, filterType: 'in', type: GridFilterType.INCLUDES });

    await userEvent.click(statusCheckbox(RunsI18nKey.Cancelled));

    expect(onModelChange).toHaveBeenCalledWith({
      filter: `${RunStatus.FAILED},${RunStatus.CANCELLED}`,
      filterType: 'in',
      type: GridFilterType.INCLUDES,
    });
  });

  // A null model deactivates the column's filter — the same state the column started in.
  test('clearing the last status contributes no filter at all', async () => {
    renderFilter({ filter: RunStatus.FAILED, filterType: 'in', type: GridFilterType.INCLUDES });

    await userEvent.click(statusCheckbox(RunsI18nKey.Failed));

    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('a status already selected renders checked, the rest unchecked', () => {
    renderFilter({ filter: RunStatus.RUNNING, filterType: 'in', type: GridFilterType.INCLUDES });

    expect(statusCheckbox(RunsI18nKey.Running)).toBeChecked();
    expect(statusCheckbox(RunsI18nKey.Completed)).not.toBeChecked();
  });

  describe('select all', () => {
    test('selects every status, and clears them when activated again', async () => {
      const { rerender } = renderFilter();

      await userEvent.click(selectAllCheckbox());
      expect(onModelChange).toHaveBeenCalledWith({
        filter: Object.values(RunStatus).join(','),
        filterType: 'in',
        type: GridFilterType.INCLUDES,
      });

      rerender(
        <CustomComponentContext.Provider value={{ setMethods: vi.fn() }}>
          <RunStatusValueFilter
            {...({
              model: { filter: Object.values(RunStatus).join(','), filterType: 'in', type: GridFilterType.INCLUDES },
              onModelChange,
            } as unknown as Props)}
          />
        </CustomComponentContext.Provider>,
      );

      expect(selectAllCheckbox()).toBeChecked();

      await userEvent.click(selectAllCheckbox());
      expect(onModelChange).toHaveBeenLastCalledWith(null);
    });

    test('reports a partial selection as mixed rather than checked', () => {
      renderFilter({ filter: RunStatus.FAILED, filterType: 'in', type: GridFilterType.INCLUDES });

      expect(selectAllCheckbox()).toHaveAttribute('aria-checked', 'mixed');
    });
  });

  test('reset clears the selection and contributes no predicate', async () => {
    renderFilter({ filter: RunStatus.FAILED, filterType: 'in', type: GridFilterType.INCLUDES });

    await userEvent.click(resetButton());

    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('reset is disabled while nothing is selected', () => {
    renderFilter();

    expect(resetButton()).toBeDisabled();
  });

  describe('doesFilterPass', () => {
    test('passes every row when there is no active model', () => {
      renderFilter(null);

      expect(doesFilterPass?.({ data: runWithStatus(RunStatus.FAILED) })).toBe(true);
    });

    test('passes only rows whose status is in the selected set', () => {
      renderFilter({
        filter: `${RunStatus.FAILED},${RunStatus.CANCELLED}`,
        filterType: 'in',
        type: GridFilterType.INCLUDES,
      });

      expect(doesFilterPass?.({ data: runWithStatus(RunStatus.FAILED) })).toBe(true);
      expect(doesFilterPass?.({ data: runWithStatus(RunStatus.COMPLETED) })).toBe(false);
    });
  });
});
