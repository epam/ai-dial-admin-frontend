'use client';
import { FC, Fragment, useEffect, useRef, useState } from 'react';
import {
  DialCheckbox,
  DialGhostButton,
  DialGhostIconButton,
  DialLabel,
  DialSelectField,
  DialInput,
  DialTooltip,
  SelectOption,
} from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import { createMeasureRow, toMeasureRows, toMeasures } from '@/src/components/Analytics/Pipelines/Aggregate/measures';
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
  targetColumns: AnalyticsTableColumn[];
  functions: QueryFunction[];
  sourceName?: string;
  onChange: (measures: Measure[]) => void;
}

// A catalog description runs from one line to a paragraph. Rendered under the label it makes the list
// unscannable, so it is revealed on hovering the option instead.
const toFunctionOption = (name: string, signature: string, description?: string): SelectOption => ({
  value: name,
  label: signature,
  labelNode: description ? (
    <DialTooltip tooltip={description} triggerClassName="w-full text-left">
      <span>{signature}</span>
    </DialTooltip>
  ) : undefined,
});

const MeasuresEditor: FC<Props> = ({ measures, columns, targetColumns, functions, sourceName, onChange }) => {
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
  const fnOptions = available.map((fn) => toFunctionOption(fn.name, fn.signature, fn.description));
  const columnOptions = columns.map((column) => ({ value: column.name, label: `${column.name} · ${column.type}` }));
  const nameOptions = targetColumns.map((column) => ({ value: column.name, label: column.name }));

  const updateRow = (id: string, patch: Partial<MeasureRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-2">
      {/* One grid for the header and every row, not a grid per row: a per-row grid sizes its own columns,
          so a row whose function takes no column — or offers no distinct — lands out of line with the rest. */}
      <div className="grid grid-cols-[minmax(140px,1.2fr)_minmax(140px,1.2fr)_minmax(140px,1.2fr)_minmax(180px,2fr)_2rem_2rem] items-center gap-x-3 gap-y-2 overflow-x-auto">
        {rows.length > 0 && (
          <>
            <DialLabel label={t(AnalyticsPipelinesI18nKey.MeasureName)} />
            <DialLabel label={t(AnalyticsPipelinesI18nKey.MeasureFn)} />
            <DialLabel label={t(AnalyticsPipelinesI18nKey.MeasureColumn)} />
            <DialLabel label={t(AnalyticsPipelinesI18nKey.MeasureWhere)} />
            <DialLabel label={t(AnalyticsPipelinesI18nKey.MeasureDistinct)} />
            <span />
          </>
        )}

        {rows.map((row, index) => {
          const fn = findMeasureFunction(available, row.fn);
          const isUnknownFn = Boolean(row.fn) && !fn;
          const takesNoColumn = isColumnlessFunction(fn);
          const isNameStranded = Boolean(row.name) && !targetColumns.some((column) => column.name === row.name);

          return (
            <Fragment key={row.id}>
              <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.MeasureName)} ${index + 1}`}>
                <DialSelectField
                  id={`measure-name-${index}`}
                  options={isNameStranded ? [...nameOptions, { value: row.name, label: row.name }] : nameOptions}
                  value={row.name}
                  invalid={isNameStranded}
                  onChange={(v) => updateRow(row.id, { name: v as string })}
                />
              </div>

              <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.MeasureFn)} ${index + 1}`}>
                <DialSelectField
                  id={`measure-fn-${index}`}
                  options={isUnknownFn ? [...fnOptions, { value: row.fn, label: row.fn }] : fnOptions}
                  value={row.fn}
                  onChange={(v) => updateRow(row.id, { fn: v as string, distinct: undefined })}
                />
              </div>

              {takesNoColumn ? (
                <span />
              ) : (
                <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.MeasureColumn)} ${index + 1}`}>
                  <DialSelectField
                    id={`measure-column-${index}`}
                    options={columnOptions}
                    value={row.column ?? ''}
                    placeholder={t(AnalyticsPipelinesI18nKey.MeasureColumnDefault)}
                    onChange={(v) => updateRow(row.id, { column: v as string })}
                  />
                </div>
              )}

              <DialInput
                id={`measure-where-${index}`}
                aria-label={`${t(AnalyticsPipelinesI18nKey.MeasureWhere)} ${index + 1}`}
                value={row.where ?? ''}
                className="font-mono"
                spellCheck={false}
                onChange={(value) => updateRow(row.id, { where: value ?? '' })}
              />

              {fn?.distinct_supported ? (
                <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.MeasureDistinct)} ${index + 1}`}>
                  <DialCheckbox
                    id={`measure-distinct-${index}`}
                    checked={Boolean(row.distinct)}
                    onChange={(checked) => updateRow(row.id, { distinct: Boolean(checked) })}
                  />
                </div>
              ) : (
                <span />
              )}

              <DialGhostIconButton
                className="shrink-0"
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={`${t(ButtonsI18nKey.Delete)} ${index + 1}`}
                onClick={() => commit(rows.filter((candidate) => candidate.id !== row.id))}
              />

              {row.distinct && !row.column && (
                <span className="col-span-6 text-error dial-tiny-text">
                  {t(AnalyticsPipelinesI18nKey.MeasureDistinctNeedsColumn)}
                </span>
              )}
              {isUnknownFn && (
                <span className="col-span-6 text-error dial-tiny-text">
                  {t(AnalyticsPipelinesI18nKey.MeasureUnknownFn)}
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      <span className="text-secondary dial-tiny-text">
        {`${t(AnalyticsPipelinesI18nKey.MeasuresColumnsNote)} ${sourceName ?? ''}`.trim()}
      </span>

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddMeasure)}
        onClick={() => commit([...rows, createMeasureRow()])}
      />
    </div>
  );
};
export default MeasuresEditor;
