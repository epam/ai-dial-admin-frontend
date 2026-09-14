'use client';

import { FC, useCallback, useEffect, useState } from 'react';
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

import AllowedValuesField from '@/src/components/Analytics/Evaluators/AllowedValuesField';
import { createOutputRow, toOutputRows, toOutputs } from '@/src/components/Analytics/Evaluators/outputs';
import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EvaluatorOutput, EvaluatorType } from '@/src/models/analytics/evaluator';
import { OutputRefinementKind, OutputRow } from '@/src/models/analytics/evaluator-ui';

const isSameDeclaration = (a: EvaluatorOutput[], b?: EvaluatorOutput[]): boolean =>
  JSON.stringify(a) === JSON.stringify(b ?? []);

interface Props {
  outputs?: EvaluatorOutput[];
  type: EvaluatorType;
  isDisabled?: boolean;
  /** The create modal opens on an empty list and says nothing about it; the detail page states the rule. */
  hasEmptyState?: boolean;
  /** Off in the create modal, which asks for the required members only — a refinement is never one. */
  hasRefinement?: boolean;
  onChange: (outputs: EvaluatorOutput[]) => void;
}

// Held to a width of its own rather than sharing the row: the refinement field beside it appears and
// disappears with the selection, and a select that resized with it would move under the pointer that
// just set it.
const REFINEMENT_SELECT_CLASS = 'w-[220px] shrink-0';
const REFINEMENT_FIELD_CLASS = 'min-w-[180px] flex-1';

const OutputsEditor: FC<Props> = ({ outputs, type, isDisabled, hasEmptyState, hasRefinement = true, onChange }) => {
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

  const isSql = type === EvaluatorType.Sql;

  const refinementOptions = [
    { value: OutputRefinementKind.Jsonata, label: t(AnalyticsEvaluatorsI18nKey.OutputJsonata) },
    { value: OutputRefinementKind.Values, label: t(AnalyticsEvaluatorsI18nKey.OutputValues) },
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

  return (
    <div className="flex flex-col gap-3">
      {!isSql && rows.length > 0 && (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEvaluatorsI18nKey.OutputsOrderHint)}</span>
      )}

      {hasEmptyState && rows.length === 0 && (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEvaluatorsI18nKey.NoOutputVars)}</span>
      )}

      {/* A sql output is one line, so its columns are named once above the list. An llm output is a block
          of several fields, where a heading row names nothing that lines up — each row labels its own. */}
      {isSql && rows.length > 0 && (
        <div className="flex flex-row items-end gap-3 pl-7">
          <DialLabel label={t(AnalyticsEvaluatorsI18nKey.VarName)} className="min-w-[180px] flex-1" required />
          <DialLabel label={t(AnalyticsEvaluatorsI18nKey.VarExpression)} className="min-w-[220px] flex-[2]" required />
          <span className="w-9 shrink-0" />
        </div>
      )}

      <DndProvider backend={HTML5Backend}>
        <div className={isSql ? 'flex flex-col gap-1' : 'flex flex-col gap-3'}>
          {rows.map((row, index) => {
            const isDuplicate = Boolean(row.name) && takenNames(row.id).has(row.name);
            const named = (key: AnalyticsEvaluatorsI18nKey) => `${t(key)} ${index + 1}`;

            const nameField = (
              <DialInput
                id={`evaluator-output-name-${index}`}
                containerClassName="min-w-[180px] flex-1"
                labelProps={isSql ? undefined : { label: t(AnalyticsEvaluatorsI18nKey.VarName), required: true }}
                aria-label={named(AnalyticsEvaluatorsI18nKey.VarName)}
                value={row.name}
                disabled={isDisabled}
                error={isDuplicate ? t(AnalyticsEvaluatorsI18nKey.OutputNameDuplicate) : undefined}
                invalid={isDuplicate}
                onChange={(value) => updateRow(row.id, { name: value ?? '' })}
              />
            );

            if (isSql) {
              return (
                <DraggableItem key={row.id} id={row.id} findItem={findItem} moveItem={moveItem}>
                  <div className="flex w-full flex-row items-end gap-3">
                    {nameField}
                    <DialInput
                      id={`evaluator-output-expression-${index}`}
                      containerClassName="min-w-[220px] flex-[2]"
                      aria-label={named(AnalyticsEvaluatorsI18nKey.VarExpression)}
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

            return (
              <DraggableItem key={row.id} id={row.id} findItem={findItem} moveItem={moveItem}>
                <div className="flex w-full flex-col gap-3 border-b border-secondary pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-row items-end gap-3">
                    {nameField}
                    {deleteButton(row)}
                  </div>

                  <DialTextarea
                    id={`evaluator-output-prose-${index}`}
                    labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.OutputProse), required: true }}
                    aria-label={named(AnalyticsEvaluatorsI18nKey.OutputProse)}
                    value={row.text}
                    disabled={isDisabled}
                    rows={3}
                    onChange={(value) => updateRow(row.id, { text: value })}
                  />

                  {/* The two refinements are declared one at a time — the service refuses them together —
                      so the selection comes first and the field that belongs to it follows. */}
                  {hasRefinement && (
                    <div className="flex flex-row items-end gap-3">
                      <DialSelectField
                        id={`evaluator-output-refinement-${index}`}
                        containerClassName={REFINEMENT_SELECT_CLASS}
                        label={t(AnalyticsEvaluatorsI18nKey.OutputRefinement)}
                        options={refinementOptions}
                        value={row.refinement}
                        disabled={isDisabled}
                        onChange={(value) => updateRow(row.id, { refinement: value as OutputRefinementKind })}
                      />

                      {row.refinement === OutputRefinementKind.Values && (
                        <AllowedValuesField
                          index={index}
                          values={row.values}
                          disabled={isDisabled}
                          onChange={(values) => updateRow(row.id, { values })}
                        />
                      )}

                      {row.refinement !== OutputRefinementKind.Values && (
                        <DialInput
                          id={`evaluator-output-jsonata-${index}`}
                          containerClassName={REFINEMENT_FIELD_CLASS}
                          labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.OutputJsonata) }}
                          aria-label={named(AnalyticsEvaluatorsI18nKey.OutputJsonata)}
                          value={row.jsonata}
                          disabled={isDisabled}
                          className="font-mono"
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
        label={t(AnalyticsEvaluatorsI18nKey.AddOutput)}
        disabled={isDisabled}
        onClick={() => commit([...rows, createOutputRow()])}
      />
    </div>
  );
};

export default OutputsEditor;
