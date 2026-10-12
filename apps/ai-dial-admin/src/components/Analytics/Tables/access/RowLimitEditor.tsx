'use client';

import { SegmentedControl } from '@epam/ai-dial-ui-kit';
import type { editor } from 'monaco-editor';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import FilterGroup from '@/src/components/Analytics/QueryBuilder/Filter/FilterGroup';
import { FilterTreeContext } from '@/src/components/Analytics/QueryBuilder/filter-tree-context';
import { isFilterRepresentable, parseFilterRoot } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { serializeNode } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createGroup, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryFilterNode } from '@/src/models/analytics/query';
import { FilterGroupNode } from '@/src/models/analytics/query-builder';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
import { RowLimitNote, RowLimitView } from '@/src/components/Analytics/Tables/access/models';
import {
  columnsToFields,
  findFieldMatches,
  hasUnfinishedCondition,
  parseFilterJson,
} from '@/src/components/Analytics/Tables/access/row-limit';

export interface RowLimitValue {
  // The predicate to store, or null while there is nothing storable.
  filter: QueryFilterNode | null;
  // False while saving would store a wider limit than the editor shows.
  isComplete: boolean;
}

interface Props {
  tableName: string;
  columns: AnalyticsTableColumn[];
  initialFilter: QueryFilterNode | null;
  highlightedField?: string | null;
  onChange: (value: RowLimitValue) => void;
}

// The service refuses a row-policy filter that calls a function outside the scalar group, so none is offered.
const NO_FUNCTIONS: [] = [];

const NOTE_LABELS: Record<RowLimitNote, AnalyticsTableAccessI18nKey> = {
  [RowLimitNote.TooDeep]: AnalyticsTableAccessI18nKey.JsonTooDeep,
  [RowLimitNote.InvalidJson]: AnalyticsTableAccessI18nKey.RowsJsonInvalid,
};

const toJson = (filter: QueryFilterNode | null): string => (filter ? JSON.stringify(filter, null, 2) : '');

const RowLimitEditor: FC<Props> = ({ tableName, columns, initialFilter, highlightedField, onChange }) => {
  const t = useI18n();

  const isInitiallyTooDeep = !!initialFilter && !isFilterRepresentable(initialFilter, 0, NO_FUNCTIONS);
  const [view, setView] = useState<RowLimitView>(isInitiallyTooDeep ? RowLimitView.Json : RowLimitView.Visual);
  const [note, setNote] = useState<RowLimitNote | null>(isInitiallyTooDeep ? RowLimitNote.TooDeep : null);
  // Edited in place, like the Query Builder's tree: every edit ends in `refresh`.
  const [tree, setTree] = useState<FilterGroupNode>(() =>
    isInitiallyTooDeep ? createGroup() : parseFilterRoot(initialFilter ?? undefined, NO_FUNCTIONS),
  );
  const [jsonText, setJsonText] = useState(() => toJson(initialFilter));
  const [, setRevision] = useState(0);
  const decorations = useRef<editor.IEditorDecorationsCollection | null>(null);
  const jsonEditor = useRef<editor.IStandaloneCodeEditor | null>(null);

  const fields = useMemo(() => columnsToFields(tableName, columns), [tableName, columns]);
  const fieldOptions = useMemo(() => fieldsToOptions(fields), [fields]);

  const emitTree = useCallback(
    (node: FilterGroupNode) =>
      onChange({ filter: serializeNode(node, NO_FUNCTIONS), isComplete: !hasUnfinishedCondition(node) }),
    [onChange],
  );

  const refresh = useCallback(() => {
    setRevision((n) => n + 1);
    emitTree(tree);
  }, [emitTree, tree]);

  const context = useMemo(() => ({ fields, functions: NO_FUNCTIONS, refresh }), [fields, refresh]);

  useEffect(() => {
    if (isInitiallyTooDeep) onChange({ filter: initialFilter, isComplete: true });
    else emitTree(tree);
    // The starting value is reported once; later ones by the edits that make them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    decorations.current?.clear();
    const instance = jsonEditor.current;
    const model = instance?.getModel();
    if (view !== RowLimitView.Json || !highlightedField || !instance || !model) return;

    decorations.current = instance.createDecorationsCollection(
      findFieldMatches(model, highlightedField).map((range) => ({
        range,
        options: { isWholeLine: true, className: 'row-limit-field-error' },
      })),
    );
  }, [highlightedField, view, jsonText]);

  const onChangeView = (next: RowLimitView) => {
    if (next === RowLimitView.Json) {
      const serialized = serializeNode(tree, NO_FUNCTIONS);
      setJsonText(toJson(serialized));
      setView(RowLimitView.Json);
      return;
    }

    const parsed = parseFilterJson(jsonText);
    if (!parsed || !isFilterRepresentable(parsed, 0, NO_FUNCTIONS)) {
      setNote(parsed ? RowLimitNote.TooDeep : RowLimitNote.InvalidJson);
      return;
    }
    setNote(null);
    setTree(parseFilterRoot(parsed, NO_FUNCTIONS));
    setView(RowLimitView.Visual);
  };

  const onChangeJson = (text: string | undefined) => {
    setJsonText(text ?? '');
    onChange({ filter: parseFilterJson(text ?? ''), isComplete: true });
  };

  const onAdd = (node: FilterGroupNode['children'][number]) => {
    tree.children.push(node);
    refresh();
  };

  return (
    <FilterTreeContext.Provider value={context}>
      <div className="flex flex-col gap-2 rounded-xl bg-layer-4 p-3">
        <SegmentedControl
          aria-label={t(AnalyticsTableAccessI18nKey.StepRows)}
          value={view}
          items={[
            { value: RowLimitView.Visual, label: t(AnalyticsTableAccessI18nKey.RowsVisual) },
            { value: RowLimitView.Json, label: t(AnalyticsTableAccessI18nKey.RowsJson) },
          ]}
          onChange={onChangeView}
        />
        {note && (
          <span role="status" className="dial-tiny-text text-secondary">
            {t(NOTE_LABELS[note])}
          </span>
        )}
        {view === RowLimitView.Visual ? (
          <>
            <FilterGroup node={tree} parent={null} fieldOptions={fieldOptions} />
            {hasUnfinishedCondition(tree) && (
              <span role="status" className="dial-tiny-text text-warning">
                {t(AnalyticsTableAccessI18nKey.IncompleteConditions)}
              </span>
            )}
            <div className="flex gap-2">
              <SectionAction
                label={`+ ${t(AnalyticsTableAccessI18nKey.AddCondition)}`}
                onClick={() => onAdd(createPredicate())}
              />
              <SectionAction
                label={`+ ${t(AnalyticsTableAccessI18nKey.AddGroup)}`}
                onClick={() => onAdd(createGroup())}
              />
            </div>
          </>
        ) : (
          <div className="h-[220px]">
            <JsonEditorBase
              value={jsonText}
              onChange={onChangeJson}
              onEditorMount={(instance) => {
                jsonEditor.current = instance;
                decorations.current = instance.createDecorationsCollection([]);
              }}
            />
          </div>
        )}
      </div>
    </FilterTreeContext.Provider>
  );
};

export default RowLimitEditor;
