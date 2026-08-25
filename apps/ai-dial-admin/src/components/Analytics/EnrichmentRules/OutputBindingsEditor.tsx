'use client';

import { FC } from 'react';

import { DialGhostButton, DialGhostIconButton, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import {
  createBindingRow,
  getBindingRowError,
  getTakenElsewhere,
} from '@/src/components/Analytics/EnrichmentRules/output-bindings';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { OutputBindingRow, OutputBindingRowError } from '@/src/models/analytics/enrichment-rules-ui';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const withStrandedValue = (options: SelectOption[], value: string, isStranded: boolean): SelectOption[] =>
  isStranded ? [...options, { value, label: value }] : options;

const getRowMessageKey = (error: OutputBindingRowError): AnalyticsEnrichmentRulesI18nKey | undefined => {
  if (error.isColumnUnavailable || error.isVarUnavailable) {
    return AnalyticsEnrichmentRulesI18nKey.BindingUnavailable;
  }
  if (error.isTypeMismatch) {
    return AnalyticsEnrichmentRulesI18nKey.BindingTypeMismatch;
  }
  return undefined;
};

interface Props {
  rows: OutputBindingRow[];
  columns: AnalyticsTableColumn[];
  vars: EvaluatorVar[];
  isReady: boolean;
  onChange: (rows: OutputBindingRow[]) => void;
}

const OutputBindingsEditor: FC<Props> = ({ rows, columns, vars, isReady, onChange }) => {
  const t = useI18n();

  if (!isReady) {
    return <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.OutputBindingsEmpty)}</span>;
  }

  const updateRow = (id: string, key: 'column' | 'var', value: string) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));

  const removeRow = (id: string) => onChange(rows.filter((row) => row.id !== id));

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

        return (
          <div
            key={row.id}
            role="group"
            aria-label={`${t(AnalyticsEnrichmentRulesI18nKey.OutputBindings)} ${index + 1}`}
            className="flex flex-col gap-1"
          >
            <div className="flex items-end gap-2">
              <DialSelectField
                id={`binding-column-${row.id}`}
                label={t(AnalyticsEnrichmentRulesI18nKey.BindingColumn)}
                options={columnOptions}
                value={row.column}
                invalid={error.isColumnUnavailable}
                containerClassName="flex-1"
                onChange={(v) => updateRow(row.id, 'column', v as string)}
              />
              <DialSelectField
                id={`binding-var-${row.id}`}
                label={t(AnalyticsEnrichmentRulesI18nKey.BindingVariable)}
                options={varOptions}
                value={row.var}
                invalid={error.isVarUnavailable}
                containerClassName="flex-1"
                onChange={(v) => updateRow(row.id, 'var', v as string)}
              />
              <DialGhostIconButton
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={`${t(ButtonsI18nKey.Delete)} ${t(AnalyticsEnrichmentRulesI18nKey.OutputBindings)} ${index + 1}`}
                onClick={() => removeRow(row.id)}
              />
            </div>
            {messageKey && <span className="text-error dial-tiny-text">{t(messageKey)}</span>}
          </div>
        );
      })}

      <DialGhostButton
        label={t(AnalyticsEnrichmentRulesI18nKey.AddBinding)}
        onClick={() => onChange([...rows, createBindingRow()])}
      />
    </div>
  );
};

export default OutputBindingsEditor;
