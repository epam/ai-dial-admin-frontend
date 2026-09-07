'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { DialCheckbox, DialGhostButton, DialGhostIconButton, DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import { createMeasureRow, toMeasureRows, toMeasures } from '@/src/components/Analytics/Pipelines/Aggregate/measures';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Measure } from '@/src/models/analytics/pipeline';
import { MeasureRow } from '@/src/models/analytics/pipeline-ui';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
import { findMeasureFunction, isColumnlessFunction, toMeasureFunctions } from '@/src/utils/analytics/measure-functions';
interface Props {
  measures?: Measure[];
  columns: AnalyticsTableColumn[];
  functions: QueryFunction[];
  sourceName?: string;
  onChange: (measures: Measure[]) => void;
}
const MeasuresEditor: FC<Props> = ({ measures, columns, functions, sourceName, onChange }) => {
  const t = useI18n();
  const [rows, setRows] = useState<MeasureRow[]>(() => toMeasureRows(measures));
  const emittedRef = useRef<Measure[] | undefined>(measures);
  useEffect(() => {
    if (measures === emittedRef.current) return;
    emittedRef.current = measures;
    setRows(toMeasureRows(measures));
  }, [measures]);
  const commit = (next: MeasureRow[]) => {
    setRows(next);
    const emitted = toMeasures(next);
    emittedRef.current = emitted;
    onChange(emitted);
  };
  const available = toMeasureFunctions(functions);
  const fnOptions = available.map((fn) => ({ value: fn.name, label: fn.signature, description: fn.description }));
  const columnOptions = columns.map((column) => ({ value: column.name, label: `${column.name} · ${column.type}` }));
  const updateRow = (id: string, patch: Partial<MeasureRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, index) => {
        const fn = findMeasureFunction(available, row.fn);
        const isUnknownFn = Boolean(row.fn) && !fn;
        const takesNoColumn = isColumnlessFunction(fn);
        return (
          <div key={row.id} className="flex flex-col gap-2 border-b border-secondary pb-4 last:border-b-0">
            <div className="flex flex-row flex-wrap items-end gap-3">
              <DialInput
                id={`measure-name-${index}`}
                containerClassName="min-w-[180px] flex-1"
                labelProps={{ label: t(AnalyticsPipelinesI18nKey.MeasureName), required: true }}
                value={row.name}
                onChange={(v) => updateRow(row.id, { name: v ?? '' })}
              />
              <DialSelectField
                id={`measure-fn-${index}`}
                containerClassName="min-w-[180px] flex-1"
                label={t(AnalyticsPipelinesI18nKey.MeasureFn)}
                options={isUnknownFn ? [...fnOptions, { value: row.fn, label: row.fn }] : fnOptions}
                value={row.fn}
                onChange={(v) => updateRow(row.id, { fn: v as string, distinct: undefined })}
              />
              {!takesNoColumn && (
                <DialSelectField
                  id={`measure-column-${index}`}
                  containerClassName="min-w-[180px] flex-1"
                  label={t(AnalyticsPipelinesI18nKey.MeasureColumn)}
                  options={columnOptions}
                  value={row.column ?? ''}
                  onChange={(v) => updateRow(row.id, { column: v as string })}
                />
              )}
              <DialGhostIconButton
                className="mb-1 shrink-0"
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={t(ButtonsI18nKey.Delete)}
                onClick={() => commit(rows.filter((candidate) => candidate.id !== row.id))}
              />
            </div>
            {fn?.distinct_supported && (
              <DialCheckbox
                id={`measure-distinct-${index}`}
                label={t(AnalyticsPipelinesI18nKey.MeasureDistinct)}
                checked={Boolean(row.distinct)}
                onChange={(checked) => updateRow(row.id, { distinct: checked })}
              />
            )}
            {row.distinct && !row.column && (
              <span className="text-error dial-tiny-text">
                {t(AnalyticsPipelinesI18nKey.MeasureDistinctNeedsColumn)}
              </span>
            )}
            {isUnknownFn && (
              <span className="text-error dial-tiny-text">{t(AnalyticsPipelinesI18nKey.MeasureUnknownFn)}</span>
            )}
            <SqlPredicateField
              id={`measure-where-${index}`}
              label={t(AnalyticsPipelinesI18nKey.MeasureWhere)}
              value={row.where}
              sourceName={sourceName}
              description={t(AnalyticsPipelinesI18nKey.MeasureWhereCaption)}
              onChange={(value) => updateRow(row.id, { where: value })}
            />
          </div>
        );
      })}
      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddMeasure)}
        onClick={() => commit([...rows, createMeasureRow()])}
      />
    </div>
  );
};
export default MeasuresEditor;
