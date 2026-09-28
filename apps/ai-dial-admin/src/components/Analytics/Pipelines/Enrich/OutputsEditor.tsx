'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import {
  DialGhostButton,
  DialGhostIconButton,
  DialInput,
  DialLabel,
  DialSelectField,
  DialTextarea,
} from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import AllowedValuesField from '@/src/components/Analytics/Pipelines/Enrich/AllowedValuesField';
import { createOutputRow, toOutputRows, toOutputs } from '@/src/components/Analytics/Pipelines/Enrich/outputs';
import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TransformOutput, TransformType } from '@/src/models/analytics/pipeline';
import { OutputRefinementKind, OutputRow } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
import { SYSTEM_COLUMN_TAG } from '@/src/constants/analytics/pipelines';

const isSameDeclaration = (a: TransformOutput[], b?: TransformOutput[]): boolean =>
  JSON.stringify(a) === JSON.stringify(b ?? []);

interface Props {
  outputs?: TransformOutput[];
  type: TransformType;
  /** The resolved target's columns: an output's name is one of them, and the column owns its type. */
  columns: AnalyticsTableColumn[];
  /** False until the target resolves — the name control has nothing to offer before then. */
  isReady: boolean;
  isDisabled?: boolean;
  /** The create modal opens on an empty list and says nothing about it; the detail page states the rule. */
  /** Off in the create modal, which asks for the required members only — a refinement is never one. */
  hasRefinement?: boolean;
  onChange: (outputs: TransformOutput[]) => void;
}

// Held to a width of its own rather than sharing the row: the refinement field beside it appears and
// disappears with the selection, and a select that resized with it would move under the pointer that
// just set it.
const REFINEMENT_SELECT_CLASS = 'w-[220px] shrink-0';
const REFINEMENT_FIELD_CLASS = 'min-w-[180px] flex-1';

const OutputsEditor: FC<Props> = ({ outputs, type, columns, isReady, isDisabled, hasRefinement = true, onChange }) => {
  const t = useI18n();

  const [rows, setRows] = useState<OutputRow[]>(() => toOutputRows(outputs, type));

  // Rows carry an id the wire shape has no room for, so they cannot be derived from the prop on every
  // render. They are re-seeded only when the prop says something the rows do not — a document replaced
  // wholesale in the JSON editor — rather than on the echo of an edit this editor just published.
  useEffect(() => {
    setRows((current) =>
      isSameDeclaration(toOutputs(current, type), outputs) ? current : toOutputRows(outputs, type),
    );
  }, [outputs, type]);

  const commit = useCallback(
    (next: OutputRow[]) => {
      setRows(next);
      onChange(toOutputs(next, type));
    },
    [onChange, type],
  );

  const updateRow = (id: string, patch: Partial<OutputRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const findItem = useCallback((id: string) => rows.findIndex((row) => row.id === id), [rows]);

  const moveItem = useCallback(
    (id: string, atIndex: number) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return;
      const next = [...rows];
      const [moved] = next.splice(index, 1);
      next.splice(atIndex, 0, moved);
      commit(next);
    },
    [commit, rows],
  );

  const isSql = type === TransformType.Sql;

  const writableColumns = useMemo(() => columns.filter((column) => column.tag !== SYSTEM_COLUMN_TAG), [columns]);

  const columnByName = useMemo(
    () => new Map(writableColumns.map((column) => [column.name, column])),
    [writableColumns],
  );

  const refinementOptions = [
    { value: OutputRefinementKind.Jsonata, label: t(AnalyticsPipelinesI18nKey.OutputJsonata) },
    { value: OutputRefinementKind.Values, label: t(AnalyticsPipelinesI18nKey.OutputValues) },
  ];

  const takenNames = (currentId: string): Set<string> =>
    new Set(rows.filter((row) => row.id !== currentId && row.name).map((row) => row.name));

  const deleteButton = (row: OutputRow) => (
    <DialGhostIconButton
      className="mb-1 shrink-0"
      icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} className="text-error" aria-hidden />}
      aria-label={t(ButtonsI18nKey.Delete)}
      disabled={isDisabled}
      onClick={() => commit(rows.filter((candidate) => candidate.id !== row.id))}
    />
  );

  if (!isReady) {
    return <span className="text-secondary dial-small">{t(AnalyticsPipelinesI18nKey.TransformEmpty)}</span>;
  }

  return (
    <div className="flex flex-col gap-3">
      {!isSql && rows.length > 0 && (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.OutputsOrderHint)}</span>
      )}

      {/* A sql output is one line, so its columns are named once above the list. An llm output is a block
          of several fields, where a heading row names nothing that lines up — each row labels its own. */}
      {isSql && rows.length > 0 && (
        <div className="flex flex-row items-end gap-3 pl-7">
          <DialLabel label={t(AnalyticsPipelinesI18nKey.OutputColumn)} className="min-w-[180px] flex-1" required />
          <DialLabel label={t(AnalyticsPipelinesI18nKey.VarExpression)} className="min-w-[220px] flex-[2]" required />
          <span className="w-9 shrink-0" />
        </div>
      )}

      <DndProvider backend={HTML5Backend}>
        <div className={isSql ? 'flex flex-col gap-1' : 'flex flex-col gap-6'}>
          {rows.map((row, index) => {
            const isDuplicate = Boolean(row.name) && takenNames(row.id).has(row.name);
            const column = columnByName.get(row.name);
            // A target that lost the column keeps the name as a marked option rather than dropping it:
            // the pipeline must stay readable and correctable.
            const isStranded = Boolean(row.name) && !column;
            const named = (key: AnalyticsPipelinesI18nKey) => `${t(key)} ${index + 1}`;

            const takenByOthers = takenNames(row.id);
            const columnOptions = writableColumns
              .filter((candidate) => !takenByOthers.has(candidate.name))
              .map((candidate) => ({ value: candidate.name, label: `${candidate.name} · ${candidate.type}` }));

            // A column that declares its own domain refuses an output redeclaring one, so rebinding to
            // it moves the row off the value list rather than leaving a refused member on the request.
            const onRebind = (name: string): Partial<OutputRow> =>
              columnByName.get(name)?.enum_values?.length
                ? { name, refinement: OutputRefinementKind.Jsonata, values: [] }
                : { name };

            const nameField = (
              <div className="min-w-[180px] flex-1">
                <DialSelectField
                  id={`transform-output-name-${index}`}
                  label={isSql ? undefined : t(AnalyticsPipelinesI18nKey.OutputColumn)}
                  aria-label={named(AnalyticsPipelinesI18nKey.OutputColumn)}
                  required={!isSql}
                  options={isStranded ? [...columnOptions, { value: row.name, label: row.name }] : columnOptions}
                  value={row.name}
                  disabled={isDisabled}
                  invalid={isDuplicate || isStranded}
                  error={outputNameError(isDuplicate, isStranded, t)}
                  onChange={(value) => updateRow(row.id, onRebind((value as string) ?? ''))}
                />
              </div>
            );

            if (isSql) {
              return (
                <DraggableItem key={row.id} id={row.id} findItem={findItem} moveItem={moveItem}>
                  <div className="flex w-full flex-row items-end gap-3">
                    {nameField}
                    <DialInput
                      id={`transform-output-expression-${index}`}
                      containerClassName="min-w-[220px] flex-[2]"
                      aria-label={named(AnalyticsPipelinesI18nKey.VarExpression)}
                      value={row.text}
                      disabled={isDisabled}
                      className="font-mono"
                      onChange={(value) => updateRow(row.id, { text: value ?? '' })}
                    />
                    {deleteButton(row)}
                  </div>
                </DraggableItem>
              );
            }

            // The column owns the domain wherever it declares one, and the service refuses an output that
            // redeclares it — so the value list is offered for a column that declares none.
            const hasColumnDomain = Boolean(column?.enum_values?.length);

            // Marked rather than blocking: the service refuses it, and the field sits under the column
            // select, so typing the column name into it is the likely mistake to warn about early.
            const isIdentityJsonata = Boolean(row.jsonata.trim()) && row.jsonata.trim() === row.name.trim();
            const refinements = hasColumnDomain
              ? refinementOptions.filter((option) => option.value !== OutputRefinementKind.Values)
              : refinementOptions;

            return (
              <DraggableItem key={row.id} id={row.id} findItem={findItem} moveItem={moveItem}>
                <div className="flex w-full flex-col gap-3 border-b border-primary pb-6 last:border-b-0 last:pb-0">
                  <div className="flex flex-row items-end gap-3">
                    {nameField}
                    {deleteButton(row)}
                  </div>

                  {hasColumnDomain && (
                    <span className="text-secondary dial-tiny-text">
                      {`${t(AnalyticsPipelinesI18nKey.OutputValues)}: ${column?.enum_values?.join(', ')}`}
                    </span>
                  )}

                  <DialTextarea
                    id={`transform-output-prose-${index}`}
                    labelProps={{ label: t(AnalyticsPipelinesI18nKey.OutputProse) }}
                    aria-label={named(AnalyticsPipelinesI18nKey.OutputProse)}
                    value={row.text}
                    // A placeholder rather than a value: what the service composes when nothing is typed,
                    // shown without becoming a copy the operator then has to maintain.
                    placeholder={column?.description ?? t(AnalyticsPipelinesI18nKey.OutputProseFromColumn)}
                    disabled={isDisabled}
                    rows={3}
                    onChange={(value) => updateRow(row.id, { text: value })}
                  />

                  {/* One at a time, so the selection comes first and the field that belongs to it follows. */}
                  {hasRefinement && (
                    <div className="flex flex-row items-end gap-3">
                      <DialSelectField
                        id={`transform-output-refinement-${index}`}
                        containerClassName={REFINEMENT_SELECT_CLASS}
                        label={t(AnalyticsPipelinesI18nKey.OutputRefinement)}
                        options={refinements}
                        value={hasColumnDomain ? OutputRefinementKind.Jsonata : row.refinement}
                        disabled={isDisabled}
                        onChange={(value) => updateRow(row.id, { refinement: value as OutputRefinementKind })}
                      />

                      {!hasColumnDomain && row.refinement === OutputRefinementKind.Values && (
                        <AllowedValuesField
                          index={index}
                          values={row.values}
                          disabled={isDisabled}
                          onChange={(values) => updateRow(row.id, { values })}
                        />
                      )}

                      {(hasColumnDomain || row.refinement !== OutputRefinementKind.Values) && (
                        <DialInput
                          id={`transform-output-jsonata-${index}`}
                          containerClassName={REFINEMENT_FIELD_CLASS}
                          labelProps={{ label: t(AnalyticsPipelinesI18nKey.OutputJsonata) }}
                          aria-label={named(AnalyticsPipelinesI18nKey.OutputJsonata)}
                          value={row.jsonata}
                          disabled={isDisabled}
                          className="font-mono"
                          error={isIdentityJsonata ? t(AnalyticsPipelinesI18nKey.OutputJsonataIdentity) : undefined}
                          invalid={isIdentityJsonata}
                          onChange={(value) => updateRow(row.id, { jsonata: value ?? '' })}
                        />
                      )}
                    </div>
                  )}
                </div>
              </DraggableItem>
            );
          })}
        </div>
      </DndProvider>

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddOutput)}
        disabled={isDisabled}
        onClick={() => commit([...rows, createOutputRow()])}
      />
    </div>
  );
};

const outputNameError = (
  isDuplicate: boolean,
  isStranded: boolean,
  t: (key: AnalyticsPipelinesI18nKey) => string,
): string | undefined => {
  if (isDuplicate) return t(AnalyticsPipelinesI18nKey.OutputNameDuplicate);
  if (isStranded) return t(AnalyticsPipelinesI18nKey.OutputColumnMissing);
  return undefined;
};

export default OutputsEditor;
