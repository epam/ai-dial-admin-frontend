'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialLoader, DialNoDataContent, DialSegmentedControl } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { IconSparkles } from '@tabler/icons-react';

import {
  executeQuery,
  executeSqlQuery,
  getEntitySchema,
  translateQuery,
  translateSqlToQuery,
} from '@/src/app/[lang]/query-builder/actions';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import AiPanel from '@/src/components/Analytics/QueryBuilder/Ai/AiPanel';
import Aggregates from '@/src/components/Analytics/QueryBuilder/Aggregate/Aggregates';
import GroupBySection from '@/src/components/Analytics/QueryBuilder/Aggregate/GroupBySection';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import FilterGroup from '@/src/components/Analytics/QueryBuilder/Filter/FilterGroup';
import ModeSwitcher from '@/src/components/Analytics/QueryBuilder/Mode/ModeSwitcher';
import DiscardQueryPopup from '@/src/components/Analytics/QueryBuilder/Modals/DiscardQueryPopup';
import PageSection from '@/src/components/Analytics/QueryBuilder/Page/PageSection';
import BuilderRail from '@/src/components/Analytics/QueryBuilder/Rail/BuilderRail';
import CollapsedRail from '@/src/components/Analytics/QueryBuilder/Rail/CollapsedRail';
import ResultArea from '@/src/components/Analytics/QueryBuilder/Result/ResultArea';
import SelectProjection from '@/src/components/Analytics/QueryBuilder/Select/SelectProjection';
import SortKeys from '@/src/components/Analytics/QueryBuilder/Sort/SortKeys';
import SqlEditor from '@/src/components/Analytics/QueryBuilder/Sql/SqlEditor';
import QueryBuilderToolbar from '@/src/components/Analytics/QueryBuilder/Toolbar/QueryBuilderToolbar';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { fieldsToOptions, havingFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { isBuilderRepresentable, parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { getResultColumns } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import { createGroup, createInitialState, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { findTimestampField, liftTimeRange } from '@/src/components/Analytics/QueryBuilder/utils/time';
import { LOCAL_STORAGE_QUERY_BUILDER_RAIL_KEY } from '@/src/constants/analytics/query-builder';
import { ButtonsI18nKey, MenuI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QueryMode, StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ExecutedQueryMeta,
  QueryBuilderColor,
  QueryBuilderState,
  QueryBuilderView,
  QueryRequestKind,
  QueryRunRequest,
  QueryTimeBound,
} from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { getErrorNotification } from '@/src/utils/notification';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

interface Props {
  initialEntities: AnalyticsEntity[];
  initialEntityName: string;
  initialFields: AnalyticsEntityField[];
  initialFunctions: QueryFunction[];
}

const QueryBuilder: FC<Props> = ({ initialEntities, initialEntityName, initialFields, initialFunctions }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { featureFlags } = useAppContext();

  const [state, setState] = useState<QueryBuilderState>(() => ({
    ...createInitialState(initialFunctions),
    entityName: initialEntityName,
    fields: initialFields,
  }));
  const [entities] = useState<AnalyticsEntity[]>(initialEntities);
  const [view, setView] = useState<QueryBuilderView>(QueryBuilderView.Form);
  const [jsonText, setJsonText] = useState('');
  const [jsonInvalid, setJsonInvalid] = useState(false);
  // Diverged: the JSON holds a valid query the visual builder cannot display (filter nesting deeper
  // than root + one group level). It stays editable and runnable; only switching to Builder is guarded.
  const [jsonDiverged, setJsonDiverged] = useState(false);
  // SQL seeds from the builder by translating the current query through the backend (authoritative);
  // leaving *edited* SQL for the Builder attempts the reverse translation and only falls back to the
  // discard guard when that fails or yields a query the builder cannot represent.
  const [sqlText, setSqlText] = useState('');
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const lastGeneratedSql = useRef('');
  const [pendingView, setPendingView] = useState<QueryBuilderView | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [result, setResult] = useState<StructuredQueryResult | null>(null);
  const [resultMeta, setResultMeta] = useState<ExecutedQueryMeta | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadedMessageIndex, setAiLoadedMessageIndex] = useState<number | null>(null);
  // Remounts AiPanel (clearing its conversation) only on an explicit user entity switch — not on
  // `state.entityName` directly, since running a message can itself change entityName (the generated
  // query may target a different entity than the one currently selected) and must NOT wipe the chat.
  const [aiConversationKey, setAiConversationKey] = useState(0);

  const resetAiQuery = () => {
    setAiLoading(false);
    setAiLoadedMessageIndex(null);
    setAiConversationKey((key) => key + 1);
  };

  const timeFilter = useTimeFilter();

  // SSR-safe: the server renders the rail expanded; the persisted flag applies after mount.
  useEffect(() => {
    setRailCollapsed(getFromLocalStorage(LOCAL_STORAGE_QUERY_BUILDER_RAIL_KEY) === 'true');
  }, []);

  const onToggleRail = (collapsed: boolean) => {
    setRailCollapsed(collapsed);
    setToLocalStorage(LOCAL_STORAGE_QUERY_BUILDER_RAIL_KEY, String(collapsed));
  };

  const refresh = useCallback(() => setState((prev) => ({ ...prev })), []);
  const patch = useCallback((partial: Partial<QueryBuilderState>) => setState((prev) => ({ ...prev, ...partial })), []);

  const onSelectEntity = async (name: string) => {
    resetAiQuery();
    setIsLoadingSchema(true);
    setSchemaError(null);
    const schema = await getEntitySchema(name);
    if (schema) {
      setState({ ...createInitialState(state.functions), entityName: name, fields: schema.fields || [] });
    } else {
      setState({ ...createInitialState(state.functions), entityName: name });
      setSchemaError(t(QueryBuilderI18nKey.SchemaLoadFailed));
      showNotification(getErrorNotification(t(QueryBuilderI18nKey.SchemaLoadFailed)));
    }
    setIsLoadingSchema(false);
  };

  const fieldsLoaded = state.fields.length > 0;
  const timestampField = useMemo(() => findTimestampField(state.fields), [state.fields]);
  const { getCurrentTimeRange } = timeFilter;
  const timeBound = useMemo<QueryTimeBound | null>(
    () => (timestampField ? { field: timestampField, range: getCurrentTimeRange() } : null),
    [timestampField, getCurrentTimeRange],
  );
  const query = useMemo(() => buildQuery(state, timeBound), [state, timeBound]);
  const json = useMemo(() => JSON.stringify(query, null, 2), [query]);
  const contextValue = useMemo(() => ({ state, refresh, patch }), [state, refresh, patch]);
  const isAggregate = state.mode === QueryMode.Aggregate;
  const isJsonView = view === QueryBuilderView.Json;
  const isSqlView = view === QueryBuilderView.Sql;
  const isAiView = view === QueryBuilderView.Ai;

  const viewOptions: SegmentedControlOption<QueryBuilderView>[] = [
    { value: QueryBuilderView.Form, label: t(QueryBuilderI18nKey.ViewForm) },
    { value: QueryBuilderView.Json, label: t(QueryBuilderI18nKey.ViewJson) },
    { value: QueryBuilderView.Sql, label: t(QueryBuilderI18nKey.ViewSql) },
    ...(featureFlags.queryAssistantEnabled
      ? [
          {
            value: QueryBuilderView.Ai,
            label: t(QueryBuilderI18nKey.ViewAi),
            icon: <IconSparkles size={16} stroke={2} />,
          },
        ]
      : []),
  ];

  // Written modes (SQL, diverged JSON) can hold queries the Builder cannot display; switching to the
  // Builder then requires confirming that the written query is dropped. SQL ⇄ JSON stays unguarded.
  // Generated (unedited) SQL is the builder's own query in another notation — never guarded.
  const sqlEdited = !!sqlText.trim() && sqlText !== lastGeneratedSql.current;

  // The AI, JSON, and SQL paths can each adopt a different entity than the one whose schema is loaded.
  // Fields must follow the query's entity: running with a stale schema makes the toolbar time bound
  // resolve its timestamp column against the wrong entity (e.g. "source_name_8"), which the backend
  // then rejects as an unknown field. Re-fetch the schema whenever the entity changes.
  const resolveFieldsForEntity = async (entityName: string): Promise<AnalyticsEntityField[]> => {
    if (!entityName || entityName === state.entityName) return state.fields;
    if (!entities.some((e) => e.name === entityName)) return state.fields;
    const schema = await getEntitySchema(entityName);
    if (schema) return schema.fields || [];
    showNotification(getErrorNotification(t(QueryBuilderI18nKey.SchemaLoadFailed)));
    return [];
  };

  // A ge/le pair on the timestamp field belongs to the toolbar control, not the visual filter tree.
  // Returns the just-computed state/time bound (not the stale `state` closure) so a caller that needs
  // to build and run a query in the same synchronous handler doesn't have to wait for a re-render.
  const hydrateBuilderFromQuery = async (
    parsed: StructuredQuery,
  ): Promise<{ fields: AnalyticsEntityField[]; state: QueryBuilderState; timeBound: QueryTimeBound | null }> => {
    const fields = await resolveFieldsForEntity(parsed.entity ?? state.entityName);
    const timestamp = findTimestampField(fields);
    const lifted = timestamp ? liftTimeRange(parsed.filter, timestamp) : null;
    const forState = lifted ? { ...parsed, filter: lifted.rest } : parsed;
    const nextState = parseQuery(forState, fields, state.functions);
    setState(nextState);
    if (lifted && !sameRange(lifted.range, timeBound?.range)) {
      timeFilter.onTimeRangeChange(lifted.range, true);
    }
    const range = lifted ? lifted.range : getCurrentTimeRange();
    return { fields, state: nextState, timeBound: timestamp ? { field: timestamp, range } : null };
  };

  // Entering SQL seeds the editor from the backend translation of the current builder query — the
  // authoritative SQL a run would execute. A query the SQL subset cannot express (translate 400)
  // leaves the editor empty and surfaces the error; user-edited SQL is never re-seeded.
  const seedSqlFromBuilder = async () => {
    setSqlLoading(true);
    setSqlError(null);
    const freshBound = timestampField ? { field: timestampField, range: getCurrentTimeRange() } : null;
    const res = await translateQuery(buildQuery(state, freshBound));
    if (res.success) {
      const sql = formatSql(res.response?.sql ?? '');
      setSqlText(sql);
      lastGeneratedSql.current = sql;
    } else {
      setSqlText('');
      lastGeneratedSql.current = '';
      setSqlError(res.errorMessage || t(QueryBuilderI18nKey.SqlTranslateFailed));
      showNotification(
        getErrorNotification(
          res.errorHeader || t(QueryBuilderI18nKey.SqlTranslateFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
    setSqlLoading(false);
  };

  const onChangeView = async (next: QueryBuilderView) => {
    if (next === view) return;
    if (next === QueryBuilderView.Form) {
      // Edited SQL: try to translate it back into the builder; only guard when that can't be shown.
      if (isSqlView && sqlEdited) {
        const res = await translateSqlToQuery(sqlText);
        if (res.success && res.response?.query && isBuilderRepresentable(res.response.query)) {
          await hydrateBuilderFromQuery(res.response.query);
          setSqlText('');
          setSqlError(null);
          lastGeneratedSql.current = '';
          setView(next);
          return;
        }
        setPendingView(next);
        return;
      }
      if (isJsonView && jsonDiverged) {
        setPendingView(next);
        return;
      }
    }
    if (next === QueryBuilderView.Json && !jsonDiverged) {
      setJsonText(json);
      setJsonInvalid(false);
    }
    // Entering SQL seeds asynchronously from the backend; user-edited SQL is never overwritten.
    if (next === QueryBuilderView.Sql && !sqlEdited) {
      setView(next);
      void seedSqlFromBuilder();
      return;
    }
    setView(next);
  };

  const onConfirmDiscard = () => {
    setSqlText('');
    setSqlError(null);
    lastGeneratedSql.current = '';
    setJsonText('');
    setJsonInvalid(false);
    setJsonDiverged(false);
    setState({
      ...createInitialState(state.functions),
      entityName: state.entityName,
      fields: state.fields,
    });
    setView(pendingView ?? QueryBuilderView.Form);
    setPendingView(null);
  };

  const onChangeJson = (text: string | undefined) => {
    const value = text ?? '';
    setJsonText(value);
    try {
      const parsed = JSON.parse(value) as StructuredQuery;
      setJsonInvalid(false);
      if (!isBuilderRepresentable(parsed)) {
        setJsonDiverged(true);
        return;
      }
      setJsonDiverged(false);
      void hydrateBuilderFromQuery(parsed);
    } catch {
      setJsonInvalid(true);
    }
  };

  const onChangeSql = (value: string) => {
    setSqlText(value);
    if (sqlError) setSqlError(null);
  };

  // Clicking a chat message's Run both loads the query (translate → hydrate, or fall back to raw SQL —
  // same path the old generate-time auto-load used) and immediately executes it. Building the request
  // from `hydrateBuilderFromQuery`'s return value (not the `state` closure) picks up both the hydrated
  // filter/group-by and a freshly computed time bound without waiting for a re-render, so the AI view's
  // one-click run gets the same live-time-bound behavior as the other views' Run.
  const onRunAiMessage = async (sql: string, index: number) => {
    setAiLoadedMessageIndex(index);
    setAiLoading(true);
    const res = await translateSqlToQuery(sql);
    let runFields = state.fields;
    let request: QueryRunRequest = { kind: QueryRequestKind.Sql, sql };
    if (res.success && res.response?.query && isBuilderRepresentable(res.response.query)) {
      const hydrated = await hydrateBuilderFromQuery(res.response.query);
      runFields = hydrated.fields;
      setSqlText('');
      setJsonText('');
      setJsonDiverged(false);
      lastGeneratedSql.current = '';
      request = { kind: QueryRequestKind.Structured, query: buildQuery(hydrated.state, hydrated.timeBound) };
    } else {
      setSqlText(formatSql(sql));
      lastGeneratedSql.current = '';
    }
    setAiLoading(false);

    setIsRunning(true);
    const runRes =
      request.kind === QueryRequestKind.Sql ? await executeSqlQuery(request.sql) : await executeQuery(request.query);
    if (runRes.success) {
      const response = runRes.response ?? { rows: [] };
      setResult(response);
      setResultMeta(buildExecutedMeta(request, response, runFields));
    } else {
      showNotification(
        getErrorNotification(
          runRes.errorHeader || t(QueryBuilderI18nKey.RunFailed),
          runRes.errorMessage,
          runRes.requestId,
        ),
      );
    }
    setIsRunning(false);
  };

  const onRun = async () => {
    let request: QueryRunRequest;
    if (isSqlView) {
      if (!sqlText.trim()) return;
      request = { kind: QueryRequestKind.Sql, sql: sqlText };
    } else if (isJsonView) {
      try {
        // The JSON view runs the query as written — including edits the builder cannot display.
        request = { kind: QueryRequestKind.Structured, query: JSON.parse(jsonText) as StructuredQuery };
      } catch {
        return;
      }
    } else {
      const freshBound = timestampField ? { field: timestampField, range: getCurrentTimeRange() } : null;
      request = { kind: QueryRequestKind.Structured, query: buildQuery(state, freshBound) };
    }

    setIsRunning(true);
    const res =
      request.kind === QueryRequestKind.Sql ? await executeSqlQuery(request.sql) : await executeQuery(request.query);
    if (res.success) {
      const response = res.response ?? { rows: [] };
      setResult(response);
      setResultMeta(buildExecutedMeta(request, response, state.fields));
    } else {
      // Keep the previously shown result instead of replacing it with a broken grid.
      showNotification(
        getErrorNotification(res.errorHeader || t(QueryBuilderI18nKey.RunFailed), res.errorMessage, res.requestId),
      );
    }
    setIsRunning(false);
  };

  const runDisabled = !fieldsLoaded || (isJsonView && jsonInvalid) || (isSqlView && !sqlText.trim());

  return (
    <QueryBuilderContext.Provider value={contextValue}>
      <div className="relative flex min-h-0 w-full flex-1 flex-col rounded bg-layer-2">
        <div className="flex flex-col gap-4 p-4 pb-3">
          <h1>{t(MenuI18nKey.QueryBuilder)}</h1>
          {entities.length > 0 && (
            <QueryBuilderToolbar
              entities={entities}
              selectedEntityName={state.entityName}
              onSelectEntity={onSelectEntity}
              timePeriod={timeFilter.timePeriod}
              onTimePeriodChange={timeFilter.onTimePeriodChange}
              timeRange={timeFilter.timeRange}
              onTimeRangeChange={timeFilter.onTimeRangeChange}
              onRun={onRun}
              runDisabled={runDisabled}
              showRun={!isAiView}
            >
              {fieldsLoaded && !isAiView && (
                <CopyButton
                  value={isSqlView ? sqlText : isJsonView ? jsonText : json}
                  valueLabel={isSqlView ? t(QueryBuilderI18nKey.SqlQuery) : t(QueryBuilderI18nKey.StructuredQueryJson)}
                  buttonLabel={t(ButtonsI18nKey.Copy)}
                />
              )}
            </QueryBuilderToolbar>
          )}
        </div>

        {!entities.length ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.EntitiesLoadFailed)} />
        ) : (
          <div className="flex min-h-0 flex-1 border-t border-primary">
            <ResultArea result={result} meta={resultMeta} isRunning={isRunning} />
            {railCollapsed ? (
              <CollapsedRail onExpand={() => onToggleRail(false)} />
            ) : (
              <BuilderRail
                onCollapse={() => onToggleRail(true)}
                switcher={
                  fieldsLoaded ? (
                    <DialSegmentedControl
                      ariaLabel={t(QueryBuilderI18nKey.ViewSwitcher)}
                      options={viewOptions}
                      value={view}
                      onChange={onChangeView}
                    />
                  ) : undefined
                }
              >
                {!fieldsLoaded ? (
                  isLoadingSchema ? (
                    <DialLoader size={40} />
                  ) : (
                    <DialNoDataContent title={schemaError ?? t(QueryBuilderI18nKey.SchemaLoadFailed)} />
                  )
                ) : isJsonView ? (
                  <div className="flex h-full min-h-0 flex-col gap-2">
                    {jsonInvalid && (
                      <span className="text-error dial-tiny-text">{t(QueryBuilderI18nKey.InvalidJson)}</span>
                    )}
                    {!jsonInvalid && jsonDiverged && (
                      <span className="text-secondary dial-tiny-text">{t(QueryBuilderI18nKey.NotShownInBuilder)}</span>
                    )}
                    <div className="min-h-0 flex-1 overflow-hidden rounded border border-primary">
                      <JsonEditorBase value={jsonText} onChange={onChangeJson} />
                    </div>
                  </div>
                ) : isSqlView ? (
                  <div className="flex h-full min-h-0 flex-col gap-2">
                    {sqlError && <span className="text-error dial-tiny-text">{sqlError}</span>}
                    <div className="min-h-0 flex-1 overflow-hidden rounded border border-primary">
                      {sqlLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <DialLoader size={32} />
                        </div>
                      ) : (
                        <SqlEditor
                          value={sqlText}
                          onChange={onChangeSql}
                          fields={state.fields}
                          entityName={state.entityName}
                          functions={state.functions}
                        />
                      )}
                    </div>
                  </div>
                ) : isAiView ? (
                  <AiPanel
                    key={aiConversationKey}
                    onRunMessage={onRunAiMessage}
                    loadedMessageIndex={aiLoadedMessageIndex}
                    runInFlight={aiLoading || isRunning}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <ModeSwitcher />

                    {isAggregate ? (
                      <>
                        <GroupBySection />
                        <Aggregates />
                      </>
                    ) : (
                      <SelectProjection />
                    )}

                    <SectionBlock
                      title={t(QueryBuilderI18nKey.Filter)}
                      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Grouping].marker}
                      action={
                        <>
                          <SectionAction
                            label={t(QueryBuilderI18nKey.AddCondition)}
                            onClick={() => {
                              state.filter.children.push(createPredicate());
                              refresh();
                            }}
                          />
                          <SectionAction
                            label={t(QueryBuilderI18nKey.AddGroup)}
                            colorClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Grouping].text}
                            onClick={() => {
                              state.filter.children.push(createGroup());
                              refresh();
                            }}
                          />
                        </>
                      }
                    >
                      {!state.filter.children.length && (
                        <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoConditions)}</span>
                      )}
                      <FilterGroup node={state.filter} parent={null} fieldOptions={fieldsToOptions(state.fields)} />
                    </SectionBlock>

                    {isAggregate && (
                      <SectionBlock
                        title={t(QueryBuilderI18nKey.Having)}
                        subtitle={t(QueryBuilderI18nKey.HavingSubtitle)}
                        markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Constraint].marker}
                        action={
                          <SectionAction
                            label={t(QueryBuilderI18nKey.AddCondition)}
                            onClick={() => {
                              state.having.children.push(createPredicate());
                              refresh();
                            }}
                          />
                        }
                      >
                        {!state.having.children.length && (
                          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoHaving)}</span>
                        )}
                        <FilterGroup
                          node={state.having}
                          parent={null}
                          fieldOptions={havingFieldOptions(state)}
                          color={QueryBuilderColor.Constraint}
                        />
                      </SectionBlock>
                    )}

                    <SortKeys />
                    <PageSection />
                  </div>
                )}
              </BuilderRail>
            )}
          </div>
        )}
      </div>

      {pendingView !== null && <DiscardQueryPopup onConfirm={onConfirmDiscard} onCancel={() => setPendingView(null)} />}
    </QueryBuilderContext.Provider>
  );
};

const sameRange = (a: TimeRange, b?: TimeRange): boolean =>
  !!b && a.startDate.getTime() === b.startDate.getTime() && a.endDate.getTime() === b.endDate.getTime();

const buildExecutedMeta = (
  request: QueryRunRequest,
  response: StructuredQueryResult,
  fields: AnalyticsEntityField[],
): ExecutedQueryMeta => {
  if (request.kind === QueryRequestKind.Sql) {
    return { kind: request.kind, mode: QueryMode.Row, dimensionColumns: [], aggregateColumns: [], columnLabels: {} };
  }
  const dimensionColumns = request.query.group_by ?? [];
  const resultColumns = getResultColumns(response)
    .map((c) => c.field)
    .filter((c): c is string => !!c);
  // Plain group-by columns carry the schema display name; scalar-fn group-bys and aggregate
  // aliases are user-authored and display as themselves (no entry).
  const columnLabels: Record<string, string> = {};
  for (const column of dimensionColumns) {
    const displayName = fields.find((f) => f.name === column)?.display_name;
    if (displayName) columnLabels[column] = displayName;
  }
  return {
    kind: request.kind,
    mode: request.query.mode,
    dimensionColumns,
    aggregateColumns: resultColumns.filter((c) => !dimensionColumns.includes(c)),
    columnLabels,
  };
};

export default QueryBuilder;
