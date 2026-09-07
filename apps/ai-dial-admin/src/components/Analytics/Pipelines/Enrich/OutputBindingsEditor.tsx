'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialGhostButton, DialGhostIconButton, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import {
  createBindingRow,
  getBindingRowError,
  getTakenElsewhere,
  toBindingRows,
  toOutputBindings,
} from '@/src/components/Analytics/Pipelines/Enrich/output-bindings';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { BindingRowError, OutputBindingRow } from '@/src/models/analytics/pipeline-ui';
import { OutputBinding } from '@/src/models/analytics/pipeline';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const withStrandedValue = (options: SelectOption[], value: string, isStranded: boolean): SelectOption[] =>
  isStranded ? [...options, { value, label: value }] : options;

const getRowMessageKey = (error: BindingRowError): AnalyticsPipelinesI18nKey | undefined => {
  if (error.isColumnUnavailable || error.isVarUnavailable) {
    return AnalyticsPipelinesI18nKey.BindingUnavailable;
  }
  if (error.isTypeMismatch) {
    return AnalyticsPipelinesI18nKey.BindingTypeMismatch;
  }
  return undefined;
};

interface Props {
  bindings?: OutputBinding[];
  columns: AnalyticsTableColumn[];
  vars: EvaluatorVar[];
  isReady: boolean;
  onChange: (bindings: OutputBinding[]) => void;
}

const OutputBindingsEditor: FC<Props> = ({ bindings, columns, vars, isReady, onChange }) => {
  const t = useI18n();

  // Only complete rows are emitted, so a half-filled row survives here rather than being round-tripped away
  // by the parent.
  const [rows, setRows] = useState<OutputBindingRow[]>(() => toBindingRows(bindings));
  const emittedRef = useRef<OutputBinding[] | undefined>(bindings);

  useEffect(() => {
    if (bindings === emittedRef.current) return;
    emittedRef.current = bindings;
    setRows(toBindingRows(bindings));
  }, [bindings]);

  const commit = (next: OutputBindingRow[]) => {
    setRows(next);
    const emitted = toOutputBindings(next);
    emittedRef.current = emitted;
    onChange(emitted);
  };

  if (!isReady) {
    return <span className="text-secondary dial-small">{t(AnalyticsPipelinesI18nKey.OutputBindingsEmpty)}</span>;
  }

  const updateRow = (id: string, key: 'column' | 'var', value: string) =>
    commit(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));

  const removeRow = (id: string) => commit(rows.filter((row) => row.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const error = getBindingRowError(row, columns, vars);
        const takenColumns = getTakenElsewhere(rows, row.id, 'column');
        const takenVars = getTakenElsewhere(rows, row.id, 'var');

        const columnOptions = withStrandedValue(
          columns
            .filter((column) => !takenColumns.has(column.name))
            .map((column) => ({ value: column.name, label: `${column.name} · ${column.type}` })),
          row.column,
          error.isColumnUnavailable,
        );

        const varOptions = withStrandedValue(
          vars
            .filter((variable) => !takenVars.has(variable.name))
            .map((variable) => ({ value: variable.name, label: `${variable.name} · ${variable.type}` })),
          row.var,
          error.isVarUnavailable,
        );

        const messageKey = getRowMessageKey(error);
        const isFirstRow = index === 0;

        return (
          <div
            key={row.id}
            role="group"
            aria-label={`${t(AnalyticsPipelinesI18nKey.OutputBindings)} ${index + 1}`}
            className="flex flex-col gap-1"
          >
            <div className="flex items-end gap-2">
              <DialSelectField
                id={`binding-column-${row.id}`}
                label={isFirstRow ? t(AnalyticsPipelinesI18nKey.BindingColumn) : undefined}
                options={columnOptions}
                value={row.column}
                invalid={error.isColumnUnavailable}
                containerClassName="flex-1"
                onChange={(v) => updateRow(row.id, 'column', v as string)}
              />
              <DialSelectField
                id={`binding-var-${row.id}`}
                label={isFirstRow ? t(AnalyticsPipelinesI18nKey.BindingVariable) : undefined}
                options={varOptions}
                value={row.var}
                invalid={error.isVarUnavailable}
                containerClassName="flex-1"
                onChange={(v) => updateRow(row.id, 'var', v as string)}
              />
              <DialGhostIconButton
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={`${t(ButtonsI18nKey.Delete)} ${t(AnalyticsPipelinesI18nKey.OutputBindings)} ${index + 1}`}
                onClick={() => removeRow(row.id)}
              />
            </div>
            {messageKey && <span className="text-error dial-tiny-text">{t(messageKey)}</span>}
          </div>
        );
      })}

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddBinding)}
        onClick={() => commit([...rows, createBindingRow()])}
      />
    </div>
  );
};

export default OutputBindingsEditor;
