'use client';

import { FC, Fragment, useEffect, useState } from 'react';

import { DialGhostButton, DialGhostIconButton, DialInput, DialLabel, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { createVarRow, getTakenVarNames, toVarRows, toVars } from '@/src/components/Analytics/Pipelines/Enrich/vars';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { PipelineVar } from '@/src/models/analytics/pipeline';
import { VarBindingKind, VarRow } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

const isSameDeclaration = (a: Record<string, PipelineVar>, b?: Record<string, PipelineVar>): boolean =>
  JSON.stringify(a) === JSON.stringify(b ?? {});

interface Props {
  vars?: Record<string, PipelineVar>;
  fields: AnalyticsEntityField[];
  isReady: boolean;
  /** The source's entity could not be read, so an empty list means "unknown", not "nothing to bind". */
  hasError?: boolean;
  onChange: (vars: Record<string, PipelineVar>) => void;
}

// One grid for the header and every row, so the rows line up as a single list rather than as a grid per
// row, which sizes its own columns and leaves neighbouring rows out of line.
const GRID = 'grid grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(180px,2fr)_2rem] items-center gap-x-3 gap-y-2';

const VariablesEditor: FC<Props> = ({ vars, fields, isReady, hasError, onChange }) => {
  const t = useI18n();

  const [rows, setRows] = useState<VarRow[]>(() => toVarRows(vars));

  // A row carries an id and a half-typed state the map cannot hold, so it is re-seeded only when the
  // prop says something the rows do not — not on the echo of an edit this editor just published.
  useEffect(() => {
    setRows((current) => (isSameDeclaration(toVars(current), vars) ? current : toVarRows(vars)));
  }, [vars]);

  const commit = (next: VarRow[]) => {
    setRows(next);
    onChange(toVars(next));
  };

  const updateRow = (id: string, patch: Partial<VarRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  if (!isReady) {
    return (
      <span className={hasError ? 'text-error dial-small' : 'text-secondary dial-small'}>
        {t(hasError ? AnalyticsPipelinesI18nKey.SourceFieldsLoadFailed : AnalyticsPipelinesI18nKey.VariablesEmpty)}
      </span>
    );
  }

  const fieldOptions = fields.map((field) => ({ value: field.name, label: `${field.name} · ${field.type}` }));

  const bindingOptions = [
    { value: VarBindingKind.Column, label: t(AnalyticsPipelinesI18nKey.VarColumn) },
    { value: VarBindingKind.Jsonata, label: t(AnalyticsPipelinesI18nKey.VarTransform) },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className={GRID}>
        <DialLabel label={t(AnalyticsPipelinesI18nKey.VarName)} />
        <DialLabel label={t(AnalyticsPipelinesI18nKey.VarBinding)} />
        <DialLabel label={t(AnalyticsPipelinesI18nKey.VarValue)} />
        <span />

        {rows.map((row, index) => {
          const isNameTaken = Boolean(row.name) && getTakenVarNames(rows, row.id).has(row.name);
          const isFieldStranded = Boolean(row.column) && !fields.some((field) => field.name === row.column);
          const isColumnBinding = row.kind === VarBindingKind.Column;

          return (
            <Fragment key={row.id}>
              <DialInput
                id={`pipeline-var-name-${index}`}
                aria-label={`${t(AnalyticsPipelinesI18nKey.VarName)} ${index + 1}`}
                value={row.name}
                className="font-mono"
                invalid={isNameTaken}
                onChange={(value) => updateRow(row.id, { name: value ?? '' })}
              />

              <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.VarBinding)} ${index + 1}`}>
                <DialSelectField
                  id={`pipeline-var-binding-${index}`}
                  options={bindingOptions}
                  value={row.kind}
                  onChange={(value) => updateRow(row.id, { kind: value as VarBindingKind })}
                />
              </div>

              {/* The two members are declared one at a time — the service refuses them together — so the
                  selection comes first and the field that belongs to it follows. */}
              {isColumnBinding ? (
                <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.VarValue)} ${index + 1}`}>
                  <DialSelectField
                    id={`pipeline-var-column-${index}`}
                    options={
                      isFieldStranded ? [...fieldOptions, { value: row.column, label: row.column }] : fieldOptions
                    }
                    value={row.column}
                    invalid={isFieldStranded}
                    onChange={(value) => updateRow(row.id, { column: value as string })}
                  />
                </div>
              ) : (
                <DialInput
                  id={`pipeline-var-jsonata-${index}`}
                  aria-label={`${t(AnalyticsPipelinesI18nKey.VarValue)} ${index + 1}`}
                  value={row.jsonata}
                  className="font-mono"
                  onChange={(value) => updateRow(row.id, { jsonata: value ?? '' })}
                />
              )}

              <DialGhostIconButton
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={`${t(ButtonsI18nKey.Delete)} ${index + 1}`}
                onClick={() => commit(rows.filter((candidate) => candidate.id !== row.id))}
              />
            </Fragment>
          );
        })}
      </div>

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddVariable)}
        onClick={() => commit([...rows, createVarRow()])}
      />
    </div>
  );
};

export default VariablesEditor;
