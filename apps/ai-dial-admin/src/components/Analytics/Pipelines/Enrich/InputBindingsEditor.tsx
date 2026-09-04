'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialGhostButton, DialGhostIconButton, DialInput, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import {
  createInputBindingRow,
  getInputRowError,
  getTakenVars,
  toInputBindingRows,
  toInputBindings,
} from '@/src/components/Analytics/Pipelines/Enrich/input-bindings';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { InputBindingKind, InputBindingRow } from '@/src/models/analytics/pipeline-ui';
import { InputBinding } from '@/src/models/analytics/pipeline';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const withStrandedValue = (options: SelectOption[], value: string, isStranded: boolean): SelectOption[] =>
  isStranded ? [...options, { value, label: value }] : options;

interface Props {
  bindings?: InputBinding[];
  columns: AnalyticsTableColumn[];
  vars: EvaluatorVar[];
  isReady: boolean;
  onChange: (bindings: InputBinding[]) => void;
}

const InputBindingsEditor: FC<Props> = ({ bindings, columns, vars, isReady, onChange }) => {
  const t = useI18n();

  const [rows, setRows] = useState<InputBindingRow[]>(() => toInputBindingRows(bindings));
  const emittedRef = useRef<InputBinding[] | undefined>(bindings);

  useEffect(() => {
    if (bindings === emittedRef.current) return;
    emittedRef.current = bindings;
    setRows(toInputBindingRows(bindings));
  }, [bindings]);

  const commit = (next: InputBindingRow[]) => {
    setRows(next);
    const emitted = toInputBindings(next);
    emittedRef.current = emitted;
    onChange(emitted);
  };

  const updateRow = (id: string, patch: Partial<InputBindingRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const removeRow = (id: string) => commit(rows.filter((row) => row.id !== id));

  if (!isReady) {
    return <span className="text-secondary dial-small">{t(AnalyticsPipelinesI18nKey.InputBindingsEmpty)}</span>;
  }

  const kindOptions = [
    { value: InputBindingKind.Column, label: t(AnalyticsPipelinesI18nKey.BindingKindColumn) },
    { value: InputBindingKind.Jsonata, label: t(AnalyticsPipelinesI18nKey.BindingKindJsonata) },
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const error = getInputRowError(row, columns, vars);
        const takenVars = getTakenVars(rows, row.id);

        const varOptions = withStrandedValue(
          vars
            .filter((variable) => !takenVars.has(variable.name))
            .map((variable) => ({ value: variable.name, label: `${variable.name} · ${variable.type}` })),
          row.var,
          error.isVarUnavailable,
        );

        const columnOptions = withStrandedValue(
          columns.map((column) => ({ value: column.name, label: `${column.name} · ${column.type}` })),
          row.value,
          error.isColumnUnavailable,
        );

        const isStranded = error.isVarUnavailable || error.isColumnUnavailable;
        const isFirstRow = index === 0;

        return (
          <div
            key={row.id}
            role="group"
            aria-label={`${t(AnalyticsPipelinesI18nKey.InputBindings)} ${index + 1}`}
            className="flex flex-col gap-1"
          >
            <div className="flex items-end gap-2">
              <DialSelectField
                id={`input-binding-var-${row.id}`}
                label={isFirstRow ? t(AnalyticsPipelinesI18nKey.BindingVariable) : undefined}
                options={varOptions}
                value={row.var}
                invalid={error.isVarUnavailable}
                containerClassName="flex-1"
                onChange={(v) => updateRow(row.id, { var: v as string })}
              />
              <DialSelectField
                id={`input-binding-kind-${row.id}`}
                label={isFirstRow ? t(AnalyticsPipelinesI18nKey.BindingKind) : undefined}
                options={kindOptions}
                value={row.kind}
                containerClassName="flex-1"
                // Clearing the value: a column name is not a JSONata expression, so it must not carry over.
                onChange={(v) => updateRow(row.id, { kind: v as InputBindingKind, value: '' })}
              />
              {row.kind === InputBindingKind.Column ? (
                <DialSelectField
                  id={`input-binding-column-${row.id}`}
                  label={isFirstRow ? t(AnalyticsPipelinesI18nKey.BindingColumn) : undefined}
                  options={columnOptions}
                  value={row.value}
                  invalid={error.isColumnUnavailable}
                  containerClassName="flex-1"
                  onChange={(v) => updateRow(row.id, { value: v as string })}
                />
              ) : (
                <DialInput
                  id={`input-binding-jsonata-${row.id}`}
                  labelProps={{ label: isFirstRow ? t(AnalyticsPipelinesI18nKey.BindingJsonata) : undefined }}
                  value={row.value}
                  className="font-mono"
                  containerClassName="flex-1"
                  onChange={(v) => updateRow(row.id, { value: v ?? '' })}
                />
              )}
              <DialGhostIconButton
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={`${t(ButtonsI18nKey.Delete)} ${t(AnalyticsPipelinesI18nKey.InputBindings)} ${index + 1}`}
                onClick={() => removeRow(row.id)}
              />
            </div>
            {isStranded && (
              <span className="text-error dial-tiny-text">{t(AnalyticsPipelinesI18nKey.BindingUnavailable)}</span>
            )}
          </div>
        );
      })}

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddBinding)}
        onClick={() => commit([...rows, createInputBindingRow()])}
      />
    </div>
  );
};

export default InputBindingsEditor;
