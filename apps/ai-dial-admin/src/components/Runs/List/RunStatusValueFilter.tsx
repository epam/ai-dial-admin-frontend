'use client';

import { FC, useCallback, useEffect, useMemo } from 'react';

import { ButtonAppearance, DialCheckbox, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { CustomFilterProps, useGridFilter } from 'ag-grid-react';

import { getStatusLabel } from '@/src/components/Common/RunStatus/utils';
import { ALL_RUN_STATUSES } from '@/src/constants/runs';
import { BasicI18nKey, ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { GridFilter } from '@/src/models/grid-filter';
import { GridFilterType } from '@/src/types/grid-filter';

type Props = CustomFilterProps<Run, unknown, GridFilter>;

const toSelected = (model: GridFilter | null): RunStatus[] =>
  model?.filter ? (model.filter.split(',') as RunStatus[]) : [];

const toModel = (selected: RunStatus[]): GridFilter | null =>
  selected.length ? { filter: selected.join(','), filterType: 'in', type: GridFilterType.INCLUDES } : null;

/**
 * Status is a fixed, five-value enum known at build time — unlike `SessionValueFilter`'s
 * server-resolved values, there's no loading/empty state and no search box, just the list.
 *
 * This filter also backs the compare-run picker, whose grid uses the client-side row model (a
 * pre-fetched `Run[]`, no server query), so `doesFilterPass` does real work rather than always
 * returning `true`: AG Grid only calls it for the client-side row model, so it's redundant — but
 * harmless — on the two infinite-row-model grids, where the server already returned matching rows.
 */
type StatusFilterColumn = Props['column'] & { filterActive: boolean };

const statusFilterParts = () => {
  const header = document.querySelector('.ag-header-cell[col-id="status"]');
  const colIndex = header?.getAttribute('aria-colindex');
  const floating = colIndex ? document.querySelector(`.ag-floating-filter[aria-colindex="${colIndex}"]`) : null;
  return { header, floating };
};

// AG Grid copies isFilterActive() onto the column only inside filterChangedCallback, and for this
// custom filter that copy lands on the previous model. The popup already shows the new model, so
// the header dot has to be brought in line with it once the new model has committed.
const syncStatusFilterIndicator = (column: StatusFilterColumn, active: boolean) => {
  if (column.filterActive !== active) {
    column.filterActive = active;
  }
  const { header, floating } = statusFilterParts();
  header?.classList.toggle('ag-header-cell-filtered', active);
  floating?.querySelector('.ag-floating-filter-button-button')?.classList.toggle('ag-filter-active', active);
};

const RunStatusValueFilter: FC<Props> = ({ model, onModelChange, column }) => {
  const t = useI18n();

  const selected = useMemo(() => toSelected(model), [model]);

  const doesFilterPass = useCallback(
    ({ data }: { data: Run }) => !model?.filter || (data.status != null && toSelected(model).includes(data.status)),
    [model],
  );

  useGridFilter({ doesFilterPass });

  useEffect(() => {
    if (!column) {
      return;
    }
    syncStatusFilterIndicator(column as StatusFilterColumn, model != null);
  }, [column, model]);

  const onToggle = (status: RunStatus, isSelected?: boolean) => {
    const next = isSelected ? [...selected, status] : selected.filter((value) => value !== status);
    onModelChange(toModel(next));
  };

  const areAllSelected = selected.length === ALL_RUN_STATUSES.length;

  const onToggleAll = () => onModelChange(areAllSelected ? null : toModel(ALL_RUN_STATUSES));

  const onReset = () => onModelChange(null);

  return (
    <div className="flex w-[205px] flex-col gap-2 bg-layer-4 p-3">
      <DialCheckbox
        id="run-status-filter-all"
        checked={areAllSelected}
        indeterminate={selected.length > 0 && !areAllSelected}
        label={t(BasicI18nKey.SelectAll)}
        onChange={onToggleAll}
      />
      <div
        role="group"
        aria-label={t(RunsI18nKey.StatusFilterGroup)}
        className="flex flex-col gap-2 border-t border-tertiary pt-2"
      >
        {ALL_RUN_STATUSES.map((status) => (
          <DialCheckbox
            key={status}
            id={`run-status-filter-${status}`}
            checked={selected.includes(status)}
            label={getStatusLabel(status, t)}
            onChange={(isSelected) => onToggle(status, isSelected)}
          />
        ))}
      </div>
      <div className="flex items-center justify-end">
        <DialNeutralButton
          appearance={ButtonAppearance.Outlined}
          label={t(ButtonsI18nKey.Reset)}
          disabled={!selected.length}
          onClick={onReset}
        />
      </div>
    </div>
  );
};

export default RunStatusValueFilter;
