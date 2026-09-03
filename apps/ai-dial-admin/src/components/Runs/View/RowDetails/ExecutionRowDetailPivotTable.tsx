'use client';

import { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { TextGridFilter } from '@/src/components/Grid/Filter/models';
import { getPivotGridTemplateColumns } from '@/src/components/Runs/Details/RowDetails/utils/pivot-column-width';
import { RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { flattenPivotFields, PivotColumn } from '@/src/components/Runs/Details/RowDetails/utils/flatten-pivot-fields';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import MetricPivotFilterCell from '@/src/components/Runs/View/RowDetails/MetricPivotFilterCell';
import PivotValueCell from '@/src/components/Runs/View/RowDetails/PivotValueCell';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GridFilterType } from '@/src/types/grid-filter';

interface Props {
  sections: RowDetailSection[];
  focusFieldKey?: string | null;
}

const HEADER_CELL_BASE = 'h-10 px-3 flex items-center bg-layer-1 border-b border-secondary dial-small-semi-text';
const EMPTY_FILTER_CELL = 'h-7 border-b border-r border-secondary bg-layer-2';

export const scrollPivotToField = (container: HTMLElement | null, fieldKey: string | null | undefined): void => {
  if (!container || !fieldKey) {
    return;
  }
  const target = container.querySelector<HTMLElement>(`[data-field-key="${CSS.escape(fieldKey)}"]`);
  target?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
};

const matchesTextFilter = (value: string, filter: TextGridFilter): boolean => {
  const target = value.toLowerCase();
  const query = filter.value.trim().toLowerCase();
  if (!query) return true;

  switch (filter.operator) {
    case GridFilterType.CONTAINS:
      return target.includes(query);
    case GridFilterType.NOT_CONTAINS:
      return !target.includes(query);
    case GridFilterType.EQUALS:
      return target === query;
    case GridFilterType.NOT_EQUAL:
      return target !== query;
    default:
      return true;
  }
};

const columnPassesMetricFilter = (
  column: PivotColumn,
  searchByField: Record<string, string>,
  filterByField: Record<string, TextGridFilter | null>,
): boolean => {
  if (!column.field.isMetric) {
    return true;
  }

  const raw = column.field.primaryRaw ?? '';
  const search = searchByField[column.field.fieldKey]?.trim().toLowerCase();
  if (search && !raw.toLowerCase().includes(search)) {
    return false;
  }

  const filter = filterByField[column.field.fieldKey];
  if (filter && !matchesTextFilter(raw, filter)) {
    return false;
  }

  return true;
};

const ExecutionRowDetailPivotTable: FC<Props> = ({ sections, focusFieldKey }) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchByField, setSearchByField] = useState<Record<string, string>>({});
  const [filterByField, setFilterByField] = useState<Record<string, TextGridFilter | null>>({});

  const allColumns = useMemo(() => flattenPivotFields(sections), [sections]);

  const columns = useMemo(() => {
    const filtered = allColumns.filter((column) => columnPassesMetricFilter(column, searchByField, filterByField));
    const seenSections = new Set<string>();
    return filtered.map((column) => {
      const isSectionStart = !seenSections.has(column.sectionKey);
      seenSections.add(column.sectionKey);
      return isSectionStart === column.isSectionStart ? column : { ...column, isSectionStart };
    });
  }, [allColumns, searchByField, filterByField]);

  const gridTemplateColumns = useMemo(
    () => getPivotGridTemplateColumns(columns, { includeStickyLabelColumn: false }),
    [columns],
  );

  const hasMetricColumns = useMemo(() => allColumns.some((column) => column.field.isMetric), [allColumns]);
  const filterTitle = t(RunsI18nKey.RunCompareFilterField);
  const searchPlaceholder = t(BasicI18nKey.Search);

  const onMetricSearchChange = useCallback((fieldKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchByField((prev) => ({ ...prev, [fieldKey]: value }));
  }, []);

  const onMetricFilterChange = useCallback((fieldKey: string, filter: TextGridFilter | null) => {
    setFilterByField((prev) => ({ ...prev, [fieldKey]: filter }));
  }, []);

  useEffect(() => {
    scrollPivotToField(scrollContainerRef.current, focusFieldKey);
  }, [focusFieldKey, columns]);

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0 rounded overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto">
        <div
          className="dial-tiny-text grid w-max min-w-full h-full"
          style={{
            gridTemplateColumns,
            gridTemplateRows: hasMetricColumns ? 'auto auto auto 1fr' : 'auto auto 1fr',
          }}
        >
          {columns.map((column) => {
            const sectionI18nKey = SECTION_I18N[column.sectionKey];
            const sectionLabel = sectionI18nKey ? t(sectionI18nKey) : column.sectionLabel;
            return (
              <div
                key={`section-${column.sectionKey}-${column.field.fieldKey}`}
                className={classNames(HEADER_CELL_BASE, 'text-secondary', column.isSectionStart ? 'border-l' : '')}
              >
                {column.isSectionStart ? <DialEllipsisTooltip text={sectionLabel} className="text-secondary" /> : null}
              </div>
            );
          })}

          {columns.map((column) => (
            <div
              key={`field-${column.sectionKey}-${column.field.fieldKey}`}
              className={classNames(HEADER_CELL_BASE, 'text-secondary border-r')}
            >
              <DialEllipsisTooltip text={column.field.label} className="text-secondary" />
            </div>
          ))}

          {hasMetricColumns
            ? columns.map((column) =>
                column.field.isMetric ? (
                  <MetricPivotFilterCell
                    key={`filter-${column.sectionKey}-${column.field.fieldKey}`}
                    searchQuery={searchByField[column.field.fieldKey] ?? ''}
                    onSearchChange={(event) => onMetricSearchChange(column.field.fieldKey, event)}
                    searchPlaceholder={searchPlaceholder}
                    filter={filterByField[column.field.fieldKey] ?? null}
                    onFilterChange={(filter) => onMetricFilterChange(column.field.fieldKey, filter)}
                    filterTitle={filterTitle}
                  />
                ) : (
                  <div
                    key={`filter-${column.sectionKey}-${column.field.fieldKey}`}
                    className={EMPTY_FILTER_CELL}
                    aria-hidden
                  />
                ),
              )
            : null}

          {columns.map((column) => (
            <PivotValueCell key={`value-${column.sectionKey}-${column.field.fieldKey}`} field={column.field} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutionRowDetailPivotTable;
