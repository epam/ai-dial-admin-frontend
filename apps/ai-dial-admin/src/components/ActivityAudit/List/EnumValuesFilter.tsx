'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { Checkbox, OutlinedButton } from '@epam/ai-dial-ui-kit';
import { CustomFilterProps, useGridFilter } from 'ag-grid-react';

import { EnumFilterValue } from '@/src/components/ActivityAudit/List/models';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { GridFilter } from '@/src/models/grid-filter';
import { GridFilterType } from '@/src/types/grid-filter';

type Props = CustomFilterProps<DialActivity, unknown, GridFilter> & { values: EnumFilterValue[] };

const toSelected = (model: GridFilter | null): string[] => (model?.filter ? model.filter.split(',') : []);

const toModel = (selected: string[]): GridFilter | null =>
  selected.length ? { filter: selected.join(','), filterType: 'in', type: GridFilterType.INCLUDES } : null;

const EnumValuesFilter: FC<Props> = ({ model, onModelChange, api, colDef, values }) => {
  const t = useI18n();

  const selected = useMemo(() => toSelected(model), [model]);

  // The backend resolves the request, so no row on screen is tested against this filter.
  const doesFilterPass = useCallback(() => true, []);

  useGridFilter({ doesFilterPass });

  // The React filter wrapper refreshes rows from the previous model, so the grid is told once the committed
  // model matches the selection. The first run is the popup opening, whose rows already match.
  const appliedFilterRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!api) {
      return;
    }
    const nextFilter = model?.filter ?? null;
    if (appliedFilterRef.current === undefined) {
      appliedFilterRef.current = nextFilter;
      return;
    }
    if (appliedFilterRef.current === nextFilter) {
      return;
    }
    appliedFilterRef.current = nextFilter;
    api.onFilterChanged();
  }, [api, model]);

  const onToggle = (value: string, isSelected?: boolean) => {
    const next = isSelected ? [...selected, value] : selected.filter((entry) => entry !== value);
    onModelChange(toModel(next));
  };

  const areAllSelected = selected.length === values.length;

  const onToggleAll = () => onModelChange(areAllSelected ? null : toModel(values.map(({ value }) => value)));

  const onReset = () => onModelChange(null);

  return (
    <div className="flex w-[205px] flex-col gap-2 bg-layer-4 p-3">
      <Checkbox
        id={`${colDef.field}-filter-all`}
        isSelected={areAllSelected}
        isIndeterminate={selected.length > 0 && !areAllSelected}
        labelProps={{ label: t(BasicI18nKey.SelectAll) }}
        onChange={onToggleAll}
      />
      <div role="group" aria-label={colDef.headerName} className="flex flex-col gap-2 border-t border-tertiary pt-2">
        {values.map(({ value, label }) => (
          <Checkbox
            key={value}
            id={`${colDef.field}-filter-${value}`}
            isSelected={selected.includes(value)}
            labelProps={{ label: label }}
            onChange={(isSelected) => onToggle(value, isSelected)}
          />
        ))}
      </div>
      <div className="flex items-center justify-end">
        <OutlinedButton label={t(ButtonsI18nKey.Reset)} disabled={!selected.length} onClick={onReset} />
      </div>
    </div>
  );
};

export default EnumValuesFilter;
