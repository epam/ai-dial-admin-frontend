'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DialItemType,
  DIAL_ICON_SIZE,
  FileIcon,
  ButtonDropdown,
  ButtonVariant,
  GhostButton,
  Spinner,
  NoDataContent,
  PrimaryButton,
  SegmentedControl,
  Button,
} from '@epam/ai-dial-ui-kit';
import type { DropdownItem, SegmentedControlItem } from '@epam/ai-dial-ui-kit';
import { IconCopy, IconPencilMinus, IconPlayerPlay } from '@tabler/icons-react';
import classNames from 'classnames';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import { getEntitySchema, translateQuery, translateSqlToQuery } from '@/src/app/[lang]/queries/actions';
import { useAnalyticsQuery } from '@/src/components/Analytics/Common/use-analytics-query';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import AiPanel from '@/src/components/Analytics/QueryBuilder/Ai/AiPanel';
import AiSidePanel from '@/src/components/Analytics/QueryBuilder/Ai/AiSidePanel';
import { useAiConversation } from '@/src/components/Analytics/QueryBuilder/Ai/use-ai-conversation';
import { ProposedQueryStatus } from '@/src/components/Analytics/QueryBuilder/Ai/models';
import AddToDashboardButton from '@/src/components/Analytics/CustomDashboards/AddToDashboard/AddToDashboardButton';
import ChipBar from '@/src/components/Analytics/QueryBuilder/Chips/ChipBar';
import { PeriodControl } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import BuilderArea from '@/src/components/Analytics/QueryBuilder/Layout/BuilderArea';
import QueryHeader from '@/src/components/Analytics/QueryBuilder/Layout/QueryHeader';
import ScopeBadge from '@/src/components/Analytics/QueryBuilder/Common/ScopeBadge';
import SourceProblemIcon from '@/src/components/Analytics/QueryBuilder/Layout/SourceProblemIcon';
import DeleteQueryPopup from '@/src/components/Analytics/QueryBuilder/Modals/DeleteQueryPopup';
import SwitchToBuilderPopup from '@/src/components/Analytics/QueryBuilder/Modals/SwitchToBuilderPopup';
import ResetQueryPopup from '@/src/components/Analytics/QueryBuilder/Modals/ResetQueryPopup';
import {
  useSourcePanelUnsavedWork,
  useSourceTableDescription,
} from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { ScorecardTrendSource } from '@/src/components/Analytics/QueryBuilder/Result/models';
import ResultArea from '@/src/components/Analytics/QueryBuilder/Result/ResultArea';
import SqlEditor from '@/src/components/Analytics/QueryBuilder/Sql/SqlEditor';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { useSavedQueryPage } from '@/src/components/Analytics/QueryBuilder/use-saved-query-page';
import DuplicateQuery from '@/src/components/Analytics/Queries/Modals/DuplicateQuery';
import EditQuery from '@/src/components/Analytics/Queries/Modals/EditQuery';
import DiscardModal from '@/src/components/EntityView/Modals/Discard/Discard';
import { savedQueryPrimarySource } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { isChipRepresentable, parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import {
  countCsvRecords,
  getPartialExportNotice,
  toExportQuery,
} from '@/src/components/Analytics/QueryBuilder/utils/csv-export';
import { buildExecutedMeta } from '@/src/components/Analytics/QueryBuilder/utils/executed-meta';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { findTimestampField, liftTimeRange } from '@/src/components/Analytics/QueryBuilder/utils/time';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { ButtonsI18nKey, QueriesI18nKey, QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartConfig,
  ExecutedQueryMeta,
  QueryBuilderState,
  QueryBuilderView,
  QueryCopyMode,
  QuerySourceProblem,
  QueryRequestKind,
  QueryResultView,
  QueryRunRequest,
  QueryTimeBound,
} from '@/src/models/analytics/query-builder';
import { ReadFailure } from '@/src/models/server-action';
import { TimeRange } from '@/src/models/time-range';
import { downloadFile } from '@/src/utils/download';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { BASE_BUTTON_ICON_PROPS, SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS } from '@/src/constants/main-layout';

interface Props {
  initialEntities: AnalyticsEntity[];
  initialEntityName: string;
  initialFields: AnalyticsEntityField[];
  initialFunctions: QueryFunction[];
  name?: string;
  savedQuery?: SavedQuery;
  translatedSql?: string | null;
  translationFailure?: ReadFailure | null;
  sourceProblem?: QuerySourceProblem | null;
  onResetDraft?: () => void;
}

const AI_PANEL_STORAGE_KEY = 'query-builder-ai-panel-open';
const COPY_HEADER_I18N: Record<QueryCopyMode, QueriesI18nKey> = {
  [QueryCopyMode.SaveDraft]: QueriesI18nKey.SaveAsQuery,
  [QueryCopyMode.Duplicate]: QueriesI18nKey.DuplicateQuery,
  [QueryCopyMode.SaveCopy]: QueriesI18nKey.SaveACopy,
};

const COPY_SUBMIT_I18N: Record<QueryCopyMode, QueriesI18nKey | ButtonsI18nKey> = {
  [QueryCopyMode.SaveDraft]: ButtonsI18nKey.Save,
  [QueryCopyMode.Duplicate]: ButtonsI18nKey.Duplicate,
  [QueryCopyMode.SaveCopy]: QueriesI18nKey.SaveACopy,
};

const QueryBuilder: FC<Props> = ({
  initialEntities,
  initialEntityName,
  initialFields,
  initialFunctions,
  name,
  savedQuery,
  translatedSql,
  translationFailure,
  sourceProblem,
  onResetDraft,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  // A run the operator walks away from is cancelled with the view rather than left to finish unseen.
  const { runQuery, runSql, exportCsv } = useAnalyticsQuery();
  const { featureFlags } = useAppContext();
  const tableDescription = useSourceTableDescription(initialEntityName);

  useReadFailureNotification(translationFailure, QueryBuilderI18nKey.SqlTranslateFailed);

  const [state, setState] = useState<QueryBuilderState>(() => ({
    ...createInitialState(initialFunctions),
    entityName: initialEntityName,
    fields: initialFields,
  }));
  const [entities] = useState<AnalyticsEntity[]>(initialEntities);
  const [view, setView] = useState<QueryBuilderView>(QueryBuilderView.Form);
  // SQL seeds from the builder by translating the current query through the backend (authoritative);
  // leaving *edited* SQL for the Builder attempts the reverse translation and only falls back to the
  // discard guard when that fails or yields a query the builder cannot represent.
  const [sqlText, setSqlText] = useState('');
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const lastGeneratedSql = useRef('');
  const [pendingView, setPendingView] = useState<QueryBuilderView | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [copyMode, setCopyMode] = useState(QueryCopyMode.SaveDraft);
  const [result, setResult] = useState<StructuredQueryResult | null>(null);
  const [resultMeta, setResultMeta] = useState<ExecutedQueryMeta | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  // The request behind the shown result, set and cleared with it: an export re-runs this, not the editor, so
  // the file matches the grid even after an edit. A failed run leaves it, as it leaves the result.
  const [lastRequest, setLastRequest] = useState<QueryRunRequest | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Owned here rather than in ResultArea because both are members of a saved query's payload: they
  // have to be readable when a save captures the page, and settable when a stored query opens.
  const [resultView, setResultView] = useState<QueryResultView>(QueryResultView.Table);
  const [chartConfig, setChartConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);
  // Set for exactly one result when a chart configuration was restored from a stored query, so the
  // first run does not reset the axes the author saved. The ordinary reset resumes afterwards.
  const isChartConfigKept = useRef(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiLoadedMessageIndex, setAiLoadedMessageIndex] = useState<number | null>(null);
  const [aiMessageStatuses, setAiMessageStatuses] = useState<Record<number, ProposedQueryStatus>>({});
  const aiConversation = useAiConversation();
  const timeFilter = useTimeFilter();

  // Axis picks belong to one result: a new run gets fresh defaults derived from its own query. The
  // one exception is a configuration just restored from a stored query — resetting that on the first
  // run would silently discard the axes its author saved.
  useEffect(() => {
    if (isChartConfigKept.current) {
      isChartConfigKept.current = false;
      return;
    }
    setChartConfig((current) => ({ ...DEFAULT_CHART_CONFIG, legend: current.legend ?? DEFAULT_CHART_CONFIG.legend }));
  }, [result]);

  useEffect(() => {
    setIsAiPanelOpen(getFromLocalStorage(AI_PANEL_STORAGE_KEY) === 'true');
  }, []);

  const onToggleAiPanel = useCallback((isOpen: boolean) => {
    setIsAiPanelOpen(isOpen);
    setToLocalStorage(AI_PANEL_STORAGE_KEY, String(isOpen));
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setResultMeta(null);
    setLastRequest(null);
  }, []);

  const refresh = useCallback(() => setState((prev) => ({ ...prev })), []);
  const patch = useCallback((partial: Partial<QueryBuilderState>) => setState((prev) => ({ ...prev, ...partial })), []);

  const fieldsLoaded = state.fields.length > 0;
  const isReadOnly = !!savedQuery && !fieldsLoaded;
  const shownSourceProblem = fieldsLoaded ? null : sourceProblem;
  const timestampField = useMemo(() => findTimestampField(state.fields), [state.fields]);
  const { getCurrentTimeRange } = timeFilter;
  const scorecardTrend = useMemo<ScorecardTrendSource>(
    () => ({
      query: lastRequest?.kind === QueryRequestKind.Structured ? lastRequest.query : null,
      timeField: timestampField ?? null,
      range: getCurrentTimeRange(),
    }),
    // The range is captured when a run lands, so the trend matches the shown number until the next run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastRequest, timestampField],
  );
  const boundPeriod = timeFilter.isCustom ? undefined : timeFilter.timePeriod;
  const timeBoundOf = useCallback(
    (range: TimeRange, period?: string): QueryTimeBound | null =>
      timestampField ? { field: timestampField, range, period } : null,
    [timestampField],
  );
  const timeBound = useMemo<QueryTimeBound | null>(
    () => timeBoundOf(getCurrentTimeRange(), boundPeriod),
    [timeBoundOf, getCurrentTimeRange, boundPeriod],
  );
  const contextValue = useMemo(() => ({ state, refresh, patch }), [state, refresh, patch]);
  const isSqlView = view === QueryBuilderView.Sql;

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const saveAsClassName = useMemo(
    () => classNames('whitespace-nowrap', (isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS),
    [isTablet, isMobile],
  );

  // Binds the page to its stored query: seeds the builder on open, tracks unsaved changes, and owns
  // save, discard, and metadata editing. Inert when no stored query was passed.
  const savedQueryPage = useSavedQueryPage({
    savedQuery,
    state,
    setState,
    sqlText,
    setSqlText,
    translatedSql,
    setView,
    lastGeneratedSql,
    isSqlView,
    timePeriod: timeFilter.timePeriod,
    isCustom: timeFilter.isCustom,
    timeRange: timeFilter.timeRange,
    onTimePeriodChange: timeFilter.onTimePeriodChange,
    onTimeRangeChange: timeFilter.onTimeRangeChange,
    resultView,
    setResultView,
    chartConfig,
    setChartConfig,
    isChartConfigKept,
    clearResult,
  });

  const viewOptions: SegmentedControlItem<QueryBuilderView>[] = [
    { value: QueryBuilderView.Form, label: t(QueryBuilderI18nKey.ViewForm) },
    { value: QueryBuilderView.Sql, label: t(QueryBuilderI18nKey.ViewSql) },
  ];

  const sqlEdited = !!sqlText.trim() && sqlText !== lastGeneratedSql.current;
  const queryFingerprint = useMemo(
    () =>
      sqlEdited
        ? `sql:${sqlText}`
        : JSON.stringify({ query: buildQuery(state), period: boundPeriod ?? getCurrentTimeRange() }),
    [sqlEdited, sqlText, state, boundPeriod, getCurrentTimeRange],
  );
  const [ranFingerprint, setRanFingerprint] = useState<string | null>(null);
  useEffect(() => {
    setRanFingerprint(result ? queryFingerprint : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);
  const isQueryChanged = !!result && ranFingerprint !== null && ranFingerprint !== queryFingerprint;

  const resolveFieldsForEntity = async (entityName: string): Promise<AnalyticsEntityField[]> => {
    if (!entityName || entityName === state.entityName) return state.fields;
    if (!entities.some((e) => e.name === entityName)) return state.fields;
    const schemaRead = await getEntitySchema(entityName);
    if (schemaRead.response) return schemaRead.response.fields || [];
    showNotification(
      getErrorNotification(t(QueryBuilderI18nKey.SchemaLoadFailed), schemaRead.errorMessage, schemaRead.requestId),
    );
    return [];
  };

  // A ge/le pair on the timestamp field belongs to the toolbar control, not the visual filter tree.
  // Returns the just-computed state/time bound (not the stale `state` closure) so a caller that needs
  // to build and run a query in the same synchronous handler doesn't have to wait for a re-render.
  const hydrateBuilderFromQuery = (
    parsed: StructuredQuery,
    fields: AnalyticsEntityField[],
  ): { state: QueryBuilderState; timeBound: QueryTimeBound | null } => {
    const timestamp = findTimestampField(fields);
    const lifted = timestamp ? liftTimeRange(parsed.filter, timestamp, state.functions) : null;
    const forState = lifted ? { ...parsed, filter: lifted.rest } : parsed;
    const nextState = parseQuery(forState, fields, state.functions);
    setState(nextState);

    // A relative pair names the preset it came from, so the toolbar goes back to that preset and
    // the window keeps moving; an absolute pair is the custom range it always was.
    if (lifted?.periodId) {
      timeFilter.onTimePeriodChange(lifted.periodId);
    } else if (lifted?.range && !sameRange(lifted.range, timeBound?.range)) {
      timeFilter.onTimeRangeChange(lifted.range, true);
    }

    const period = lifted?.periodId ?? (lifted?.range ? undefined : boundPeriod);
    const range = lifted?.range ?? (lifted?.periodId ? getTimeRangeById(lifted.periodId) : getCurrentTimeRange());
    return { state: nextState, timeBound: timestamp ? { field: timestamp, range, period } : null };
  };

  // Entering SQL seeds the editor from the backend translation of the current builder query — the
  // authoritative SQL a run would execute. A query the SQL subset cannot express (translate 400)
  // leaves the editor empty and surfaces the error; user-edited SQL is never re-seeded.
  const seedSqlFromBuilder = async () => {
    setSqlLoading(true);
    setSqlError(null);
    const freshBound = timeBoundOf(getCurrentTimeRange(), boundPeriod);
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
        getErrorNotification(t(QueryBuilderI18nKey.SqlTranslateFailed), res.errorMessage, res.requestId),
      );
    }
    setSqlLoading(false);
  };

  const leaveSqlBuffer = async (): Promise<void> => {
    const translated = await translateSqlOrNull(sqlText);
    const fields = translated ? await resolveFieldsForEntity(translated.entity ?? state.entityName) : [];

    if (!translated || !isChipRepresentable(translated, state.functions, fields)) {
      setPendingView(QueryBuilderView.Form);
      return;
    }

    hydrateBuilderFromQuery(translated, fields);
    setSqlText('');
    setSqlError(null);
    lastGeneratedSql.current = '';
    setView(QueryBuilderView.Form);
  };

  const onChangeView = async (next: QueryBuilderView) => {
    if (next === view) return;
    // Judged by the SQL buffer, not the view being left: SQL the builder was never hydrated from can sit
    // in the buffer while another view is active, and the builder would then show an older query.
    if (sqlEdited && next === QueryBuilderView.Form) {
      await leaveSqlBuffer();
      return;
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
    setState({
      ...createInitialState(state.functions),
      entityName: state.entityName,
      fields: state.fields,
    });
    setView(pendingView ?? QueryBuilderView.Form);
    setPendingView(null);
  };

  const onChangeSql = (value: string) => {
    setSqlText(value);
    if (sqlError) setSqlError(null);
  };

  const onDismissAiMessage = (index: number) =>
    setAiMessageStatuses((statuses) => ({ ...statuses, [index]: ProposedQueryStatus.Dismissed }));

  // Clicking a chat message's Run both loads the query (translate → hydrate, or fall back to raw SQL —
  // same path the old generate-time auto-load used) and immediately executes it. Building the request
  // from `hydrateBuilderFromQuery`'s return value (not the `state` closure) picks up both the hydrated
  // filter/group-by and a freshly computed time bound without waiting for a re-render, so the AI view's
  // one-click run gets the same live-time-bound behavior as the other views' Run.
  const onRunAiMessage = async (sql: string, index: number) => {
    setAiLoadedMessageIndex(index);
    setAiLoading(true);
    const translated = await translateSqlOrNull(sql);
    let runFields = state.fields;
    let runEntityName = state.entityName;
    let request: QueryRunRequest = { kind: QueryRequestKind.Sql, sql };
    const loadAsSql = () => {
      setSqlText(formatSql(sql));
      setSqlError(null);
      lastGeneratedSql.current = '';
      setView(QueryBuilderView.Sql);
    };
    try {
      const fields = translated ? await resolveFieldsForEntity(translated.entity ?? state.entityName) : [];
      if (translated && isChipRepresentable(translated, state.functions, fields)) {
        const hydrated = hydrateBuilderFromQuery(translated, fields);
        runFields = fields;
        runEntityName = hydrated.state.entityName;
        setSqlText('');
        lastGeneratedSql.current = '';
        setView(QueryBuilderView.Form);
        request = { kind: QueryRequestKind.Structured, query: buildQuery(hydrated.state, hydrated.timeBound) };
      } else {
        loadAsSql();
      }
    } catch {
      // The builder could not take the query (its schema read failed in transit), so it runs as the SQL it was.
      loadAsSql();
    } finally {
      setAiLoading(false);
    }

    setIsRunning(true);
    const runRes = request.kind === QueryRequestKind.Sql ? await runSql(request.sql) : await runQuery(request.query);
    // The page was left mid-run: the read is cancelled, and there is nobody to show a result or a failure to.
    if (runRes.isCancelled) {
      setIsRunning(false);
      return;
    }

    if (runRes.isSuccess) {
      const response = runRes.result ?? { rows: [] };
      setResult(response);
      setResultMeta(buildExecutedMeta(request, response, runFields, runEntityName, translated));
      setLastRequest(request);
      setAiMessageStatuses((statuses) => ({ ...statuses, [index]: ProposedQueryStatus.Applied }));
    } else {
      showNotification(getErrorNotification(t(QueryBuilderI18nKey.RunFailed), runRes.error, runRes.requestId));
    }
    setIsRunning(false);
  };

  const onRun = async () => {
    let request: QueryRunRequest;
    if (isSqlView) {
      if (!sqlText.trim()) return;
      request = { kind: QueryRequestKind.Sql, sql: sqlText };
    } else {
      const freshBound = timeBoundOf(getCurrentTimeRange(), boundPeriod);
      request = { kind: QueryRequestKind.Structured, query: buildQuery(state, freshBound) };
    }

    setIsRunning(true);
    const [res, translated] = await Promise.all([
      request.kind === QueryRequestKind.Sql ? runSql(request.sql) : runQuery(request.query),
      translateForMeta(request),
    ]);
    if (res.isCancelled) {
      setIsRunning(false);
      return;
    }

    if (res.isSuccess) {
      const response = res.result ?? { rows: [] };
      setResult(response);
      setResultMeta(buildExecutedMeta(request, response, state.fields, state.entityName, translated));
      setLastRequest(request);
    } else {
      // Keep the previously shown result instead of replacing it with a broken grid.
      showNotification(getErrorNotification(t(QueryBuilderI18nKey.RunFailed), res.error, res.requestId));
    }
    setIsRunning(false);
  };

  const onExportCsv = async () => {
    if (!lastRequest || isExporting) return;

    setIsExporting(true);
    const res = await exportCsv(
      lastRequest.kind === QueryRequestKind.Structured
        ? { kind: QueryRequestKind.Structured, query: toExportQuery(lastRequest.query) }
        : lastRequest,
    );
    setIsExporting(false);
    if (res.isCancelled) return;

    if (!res.isSuccess || !res.file) {
      showNotification(getErrorNotification(t(QueryBuilderI18nKey.ExportCsvFailed), res.error, res.requestId));
      return;
    }

    const { blob, fileName, totalCount } = res.file;
    downloadFile(blob, fileName);

    const partialNotice = getPartialExportNotice(countCsvRecords(await blob.text()), totalCount);
    if (partialNotice) {
      showNotification(
        getSuccessNotification(t(QueryBuilderI18nKey.ExportCsvDone), t(partialNotice.key, partialNotice.params)),
      );
    }
  };

  const runDisabled = (!fieldsLoaded && !isReadOnly) || (isSqlView && !sqlText.trim());
  const isSaveBlocked = runDisabled && !(fieldsLoaded && savedQueryPage.hasUnloadedBody);

  const isSaveDisabled = isSaveBlocked || savedQueryPage.isSaving;

  const onOpenCopy = (mode: QueryCopyMode) => {
    setCopyMode(mode);
    savedQueryPage.onOpenSaveAs();
  };

  const saveItems: DropdownItem[] = [
    { key: 'save-copy', label: t(QueriesI18nKey.SaveACopyMenuItem), onClick: () => onOpenCopy(QueryCopyMode.SaveCopy) },
  ];

  const renderDraftActions = () => (
    <>
      {savedQueryPage.isDirty && <GhostButton label={t(ButtonsI18nKey.Reset)} onClick={() => setIsResetOpen(true)} />}
      <Button
        className={saveAsClassName}
        variant={ButtonVariant.Neutral}
        label={t(QueriesI18nKey.SaveAsQuery)}
        onClick={() => onOpenCopy(QueryCopyMode.SaveDraft)}
        disabled={isSaveDisabled}
      />
    </>
  );

  const renderChangedActions = () => (
    <>
      <GhostButton label={t(ButtonsI18nKey.Discard)} onClick={() => setIsDiscardOpen(true)} />
      {savedQueryPage.isWritable ? (
        <div role="group" aria-label={t(ButtonsI18nKey.Save)} className={classNames('flex', saveAsClassName)}>
          <Button
            className="rounded-r-none"
            variant={ButtonVariant.Neutral}
            label={t(ButtonsI18nKey.Save)}
            onClick={() => void savedQueryPage.onSave()}
            disabled={isSaveDisabled}
          />
          <ButtonDropdown
            className="-ml-px rounded-l-none px-3"
            variant={ButtonVariant.Neutral}
            aria-label={t(QueriesI18nKey.SaveOptions)}
            items={saveItems}
            disabled={isSaveDisabled}
            dropdownProps={{ placement: 'bottom-end', matchReferenceWidth: false }}
          />
        </div>
      ) : (
        <Button
          className={saveAsClassName}
          variant={ButtonVariant.Neutral}
          label={t(QueriesI18nKey.SaveACopy)}
          onClick={() => onOpenCopy(QueryCopyMode.SaveCopy)}
          disabled={isSaveDisabled}
        />
      )}
    </>
  );

  const renderSavedActions = () => (
    <>
      {savedQueryPage.isWritable && (
        <RemoveButton label={t(ButtonsI18nKey.Delete)} onClick={savedQueryPage.onOpenDelete} />
      )}
      {savedQueryPage.isWritable && (
        <GhostButton
          label={t(ButtonsI18nKey.Edit)}
          iconBefore={<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          onClick={savedQueryPage.onOpenEdit}
        />
      )}
      <Button
        className={saveAsClassName}
        variant={ButtonVariant.Neutral}
        label={t(ButtonsI18nKey.Duplicate)}
        iconBefore={<IconCopy {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
        onClick={() => onOpenCopy(QueryCopyMode.Duplicate)}
        disabled={isSaveDisabled}
      />
    </>
  );

  const renderActions = () => {
    if (savedQueryPage.isDraft) return renderDraftActions();
    return savedQueryPage.isDirty ? renderChangedActions() : renderSavedActions();
  };

  const onConfirmDiscardChanges = () => {
    setIsDiscardOpen(false);
    savedQueryPage.onDiscard();
  };

  const onConfirmReset = () => {
    setIsResetOpen(false);
    onResetDraft?.();
  };

  useSourcePanelUnsavedWork(savedQueryPage.isDirty, savedQueryPage.isDraft ? onResetDraft : savedQueryPage.onDiscard);

  const period = useMemo<PeriodControl | null>(
    () =>
      timestampField || (isReadOnly && savedQuery?.time)
        ? {
            timePeriod: timeFilter.timePeriod,
            isCustom: timeFilter.isCustom,
            timeRange: timeFilter.timeRange,
            onChangeTimePeriod: timeFilter.onTimePeriodChange,
            onChangeTimeRange: timeFilter.onTimeRangeChange,
          }
        : null,
    [
      timestampField,
      isReadOnly,
      savedQuery?.time,
      timeFilter.timePeriod,
      timeFilter.isCustom,
      timeFilter.timeRange,
      timeFilter.onTimePeriodChange,
      timeFilter.onTimeRangeChange,
    ],
  );

  const renderBuilderArea = () => {
    if (!fieldsLoaded && !isReadOnly) return <NoDataContent title={t(QueryBuilderI18nKey.SchemaLoadFailed)} />;
    if (!isSqlView) return <ChipBar period={period} isReadOnly={isReadOnly} />;

    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {sqlError && <span className="text-error dial-tiny-text">{sqlError}</span>}
        <div className="min-h-0 flex-1 overflow-hidden">
          {sqlLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner size={32} fullWidth />
            </div>
          ) : (
            <SqlEditor value={sqlText} onChange={onChangeSql} />
          )}
        </div>
      </div>
    );
  };

  const sourceName = savedQueryPage.savedQuery
    ? state.entityName || savedQueryPrimarySource(savedQueryPage.savedQuery)
    : '';

  const isAddToDashboardShown =
    featureFlags.analyticsCustomDashboardsEnabled && !!savedQueryPage.savedQuery && !savedQueryPage.isDirty;

  return (
    <QueryBuilderContext.Provider value={contextValue}>
      <div className="relative flex min-h-0 w-full flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 pr-4">
          <QueryHeader
            title={name ?? t(QueriesI18nKey.Title)}
            badge={savedQueryPage.savedQuery && <ScopeBadge scope={savedQueryPage.savedQuery.scope} />}
            subtitle={
              savedQueryPage.savedQuery && (
                <span className="flex items-center gap-2 text-secondary dial-small-text">
                  <FileIcon
                    type={DialItemType.File}
                    name={sourceName}
                    fileExtension="csv"
                    size={DIAL_ICON_SIZE.SM}
                    decorative
                  />
                  {sourceName}
                  {shownSourceProblem && <SourceProblemIcon problem={shownSourceProblem} />}
                </span>
              )
            }
            description={savedQueryPage.isDraft ? tableDescription : savedQueryPage.savedQuery?.description}
          >
            {renderActions()}
          </QueryHeader>

          {!entities.length ? (
            <NoDataContent title={t(QueryBuilderI18nKey.EntitiesLoadFailed)} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {(fieldsLoaded || isReadOnly) && (
                  <SegmentedControl
                    aria-label={t(QueryBuilderI18nKey.ViewSwitcher)}
                    items={viewOptions}
                    value={view}
                    onChange={onChangeView}
                    // Loading an AI message decides what lands in the SQL buffer; a switch made before
                    // it returns would leave that SQL pending under a view that never showed it.
                    disabled={aiLoading}
                  />
                )}
                <div className="ml-auto flex items-center gap-3">
                  {(fieldsLoaded || isReadOnly) && isSqlView && (
                    <CopyButton
                      value={sqlText}
                      valueLabel={t(QueryBuilderI18nKey.SqlQuery)}
                      buttonLabel={t(ButtonsI18nKey.Copy)}
                    />
                  )}
                  <PrimaryButton
                    label={t(QueryBuilderI18nKey.Run)}
                    iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                    disabled={runDisabled}
                    onClick={onRun}
                  />
                </div>
              </div>

              <BuilderArea ariaLabel={t(QueryChipsI18nKey.ResizeBuilder)}>{renderBuilderArea()}</BuilderArea>

              <ResultArea
                result={result}
                meta={resultMeta}
                isRunning={isRunning}
                isQueryChanged={isQueryChanged}
                view={resultView}
                onChangeView={setResultView}
                chartConfig={chartConfig}
                onChangeChartConfig={setChartConfig}
                isExporting={isExporting}
                onExportCsv={onExportCsv}
                trendSource={scorecardTrend}
                actions={
                  isAddToDashboardShown &&
                  savedQueryPage.savedQuery && <AddToDashboardButton savedQuery={savedQueryPage.savedQuery} />
                }
              />
            </>
          )}
        </div>
        {featureFlags.queryAssistantEnabled && fieldsLoaded && (
          <AiSidePanel isOpen={isAiPanelOpen} isOverlay={isTablet || isMobile} onToggle={onToggleAiPanel}>
            <AiPanel
              conversation={aiConversation}
              onRunMessage={onRunAiMessage}
              loadedMessageIndex={aiLoadedMessageIndex}
              messageStatuses={aiMessageStatuses}
              onDismissMessage={onDismissAiMessage}
              runInFlight={aiLoading || isRunning}
            />
          </AiSidePanel>
        )}
      </div>

      {savedQueryPage.isEditOpen && savedQueryPage.savedQuery && (
        <EditQuery
          query={savedQueryPage.savedQuery}
          onClose={savedQueryPage.onCloseEdit}
          onSaved={savedQueryPage.onEdited}
        />
      )}

      {savedQueryPage.isSaveAsOpen && (
        <DuplicateQuery
          header={t(COPY_HEADER_I18N[copyMode])}
          submitLabel={t(COPY_SUBMIT_I18N[copyMode])}
          query={savedQueryPage.savedQuery}
          buildRequest={savedQueryPage.buildSaveAsRequest}
          onCreated={savedQueryPage.isDraft ? undefined : savedQueryPage.onSaveAsCreated}
          onClose={savedQueryPage.onCloseSaveAs}
        />
      )}

      {savedQueryPage.isDeleteOpen && savedQueryPage.savedQuery && (
        <DeleteQueryPopup
          query={savedQueryPage.savedQuery}
          onRemove={savedQueryPage.onRemove}
          onClose={savedQueryPage.onCloseDelete}
        />
      )}

      {isDiscardOpen && (
        <DiscardModal
          onConfirm={onConfirmDiscardChanges}
          onClose={() => setIsDiscardOpen(false)}
          onCancel={() => setIsDiscardOpen(false)}
        />
      )}

      {isResetOpen && <ResetQueryPopup onConfirm={onConfirmReset} onCancel={() => setIsResetOpen(false)} />}

      {pendingView !== null && (
        <SwitchToBuilderPopup onConfirm={onConfirmDiscard} onCancel={() => setPendingView(null)} />
      )}
    </QueryBuilderContext.Provider>
  );
};

const sameRange = (a: TimeRange, b?: TimeRange): boolean =>
  !!b && a.startDate.getTime() === b.startDate.getTime() && a.endDate.getTime() === b.endDate.getTime();

// A translation that fails in transit counts as a refused one: the translation is rejected routinely
// (the SQL view exists for DSL-inexpressible SQL), and no caller — a view switch, an AI run, the run's
// description — may be taken down by it.
const translateSqlOrNull = async (sql: string): Promise<StructuredQuery | null> => {
  try {
    const res = await translateSqlToQuery(sql);
    return res?.success ? (res.response?.query ?? null) : null;
  } catch {
    return null;
  }
};

const translateForMeta = async (request: QueryRunRequest): Promise<StructuredQuery | null> =>
  request.kind === QueryRequestKind.Sql ? translateSqlOrNull(request.sql) : null;

export default QueryBuilder;
