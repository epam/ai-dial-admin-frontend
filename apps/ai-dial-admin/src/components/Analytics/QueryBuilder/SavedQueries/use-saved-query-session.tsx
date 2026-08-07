'use client';

import { Dispatch, MutableRefObject, SetStateAction, useCallback, useMemo, useState } from 'react';

import {
  createSavedQuery,
  deleteSavedQuery as deleteSavedQueryAction,
  updateSavedQuery,
} from '@/src/app/[lang]/query-builder/actions';
import { useSavedQueries } from '@/src/components/Analytics/QueryBuilder/SavedQueries/use-saved-queries';
import { toBuilderRestore, toSavedQueryRequest } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import {
  describeSavedQueryError,
  SavedQueryErrorDescriptor,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { savedQueryTags } from '@/src/components/Analytics/QueryBuilder/utils/saved-query-list';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  ChartConfig,
  QueryBuilderState,
  QueryBuilderView,
  QueryResultView,
} from '@/src/models/analytics/query-builder';
import {
  SaveQueryDialogMode,
  SaveQueryForm,
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryEditor,
  SavedQueryErrorCode,
  SavedQueryScope,
  SavedQueryTime,
  SavedQueryTimeAction,
  SavedQueryTimeMode,
} from '@/src/models/analytics/saved-query';
import { TimeRange } from '@/src/models/time-range';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

// The orchestrator owns every piece of state a saved query captures, so the session borrows them all
// rather than duplicating any: what is saved is exactly what is on screen.
export interface SavedQuerySessionInput {
  state: QueryBuilderState;
  setState: Dispatch<SetStateAction<QueryBuilderState>>;
  sqlText: string;
  setSqlText: (value: string) => void;
  setJsonText: (value: string) => void;
  setJsonDiverged: (value: boolean) => void;
  setView: (view: QueryBuilderView) => void;
  lastGeneratedSql: MutableRefObject<string>;
  isSqlView: boolean;
  timePeriod: string;
  isCustom: boolean;
  timeRange: TimeRange;
  onTimePeriodChange: (period: string) => void;
  onTimeRangeChange: (range: TimeRange, custom?: boolean) => void;
  resultView: QueryResultView;
  setResultView: (view: QueryResultView) => void;
  chartConfig: ChartConfig;
  setChartConfig: (config: ChartConfig) => void;
  keepChartConfig: MutableRefObject<boolean>;
  clearResult: () => void;
  resolveFieldsForEntity: (entityName: string) => Promise<AnalyticsEntityField[]>;
  runDisabled: boolean;
}

const KNOWN_PERIODS = timePeriodOptionsConfig.map((option) => option.value);

const emptyForm = (scope: SavedQueryScope): SaveQueryForm => ({
  name: '',
  description: '',
  tag: '',
  scope,
  captureTime: true,
  saveAsChart: true,
});

export const useSavedQuerySession = (input: SavedQuerySessionInput) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { isFullAdmin } = useAppContext();
  const library = useSavedQueries();

  const [loaded, setLoaded] = useState<SavedQuery | null>(null);
  const [loadedForm, setLoadedForm] = useState<SaveQueryForm | null>(null);
  // The serialized payload a save would have sent at the last load or write. Comparing against the
  // live one catches a changed sort, chart or captured period exactly as it catches a changed filter,
  // and cannot drift from what is actually saved because it is what is actually saved.
  const [baseline, setBaseline] = useState<string | null>(null);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<SaveQueryDialogMode | null>(null);
  const [saveError, setSaveError] = useState<SavedQueryErrorDescriptor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedQuery | null>(null);

  const currentTime = useMemo<SavedQueryTime>(
    () =>
      input.isCustom
        ? {
            mode: SavedQueryTimeMode.Absolute,
            from: input.timeRange.startDate.toISOString(),
            to: input.timeRange.endDate.toISOString(),
          }
        : { mode: SavedQueryTimeMode.Relative, period: input.timePeriod },
    [input.isCustom, input.timeRange, input.timePeriod],
  );

  const captureInput = useCallback(
    (form: SaveQueryForm, overrides?: Partial<SavedQueryCaptureInput>): SavedQueryCaptureInput => ({
      state: input.state,
      sqlText: input.isSqlView ? input.sqlText : null,
      name: form.name,
      description: form.description,
      tag: form.tag,
      scope: form.scope,
      timePeriod: input.timePeriod,
      isCustom: input.isCustom,
      timeRange: input.timeRange,
      captureTime: form.captureTime,
      resultView: form.saveAsChart ? input.resultView : QueryResultView.Table,
      chartConfig: input.chartConfig,
      ...overrides,
    }),
    [input],
  );

  const liveRequest = useMemo(
    () => (loadedForm ? toSavedQueryRequest(captureInput(loadedForm)) : null),
    [loadedForm, captureInput],
  );

  const isDirty = !!loaded && !!baseline && !!liveRequest && JSON.stringify(liveRequest) !== baseline;

  // A common query is writable only by a full admin; everyone else copies it into their own library.
  const canOverwrite = !loaded || loaded.scope !== SavedQueryScope.Common || isFullAdmin;

  // Overwriting a loaded query that has not diverged would write the same body back, and the service
  // bumps `generation` and refreshes `updated_at` on every write — which is the key the list is
  // ordered by. So an identical save silently reshuffles the library for no gain.
  //
  // The rule applies only where Save *overwrites*: a scratch query has nothing to compare against,
  // and for a common query the caller cannot write, Save means "copy into my library", which is a
  // real action whether or not anything changed.
  const saveWouldBeNoop = !!loaded && canOverwrite && !isDirty;
  const saveDisabled = input.runDisabled || saveWouldBeNoop;

  const applyRestore = useCallback(
    async (saved: SavedQuery) => {
      const entityName = saved.query?.entity ?? saved.source ?? input.state.entityName;
      const fields = await input.resolveFieldsForEntity(entityName);
      const restore = toBuilderRestore({
        saved,
        fields,
        functions: input.state.functions,
        knownPeriods: KNOWN_PERIODS,
      });

      input.setState(restore.state);
      input.clearResult();

      input.setSqlText(restore.sqlText);
      // Marked as user-authored so entering the SQL view never re-seeds over the stored text.
      input.lastGeneratedSql.current = '';
      input.setJsonText(restore.jsonText);
      input.setJsonDiverged(restore.editor === SavedQueryEditor.Json);
      input.setView(
        restore.editor === SavedQueryEditor.Sql
          ? QueryBuilderView.Sql
          : restore.editor === SavedQueryEditor.Json
            ? QueryBuilderView.Json
            : QueryBuilderView.Form,
      );

      // A relative period is re-applied as a period, never as the instants it resolved to when the
      // query was authored — that is what keeps a saved query moving with the calendar.
      let timePeriod = input.timePeriod;
      let isCustom = input.isCustom;
      let timeRange = input.timeRange;
      if (restore.time.action === SavedQueryTimeAction.ApplyPeriod && restore.time.period) {
        input.onTimePeriodChange(restore.time.period);
        timePeriod = restore.time.period;
        isCustom = false;
      } else if (restore.time.action === SavedQueryTimeAction.ApplyRange && restore.time.range) {
        input.onTimeRangeChange(restore.time.range, true);
        isCustom = true;
        timeRange = restore.time.range;
      }

      input.setResultView(restore.resultView);
      if (restore.chartConfig) {
        input.setChartConfig(restore.chartConfig);
        // ChartConfig is meaningless without a result, and the first run after a load is the only
        // chance the saved setup gets — so that one result must not reset it.
        input.keepChartConfig.current = true;
      }

      const form: SaveQueryForm = {
        name: saved.name,
        description: saved.description ?? '',
        tag: saved.tag ?? '',
        scope: saved.scope,
        captureTime: !!saved.time,
        saveAsChart: restore.resultView === QueryResultView.Chart,
      };
      setLoaded(saved);
      setLoadedForm(form);
      // Built from the just-restored values rather than the live closure, which has not re-rendered.
      setBaseline(
        JSON.stringify(
          toSavedQueryRequest(
            captureInput(form, {
              state: restore.state,
              sqlText: restore.editor === SavedQueryEditor.Sql ? restore.sqlText : null,
              timePeriod,
              isCustom,
              timeRange,
              resultView: restore.resultView,
              chartConfig: restore.chartConfig ?? input.chartConfig,
            }),
          ),
        ),
      );
    },
    [input, captureInput],
  );

  // Detaches the builder from the loaded query while leaving its content on screen: the query becomes
  // an unnamed scratch query again. Deliberately does not reset the builder — that would discard work
  // with no way back, and "close" should not mean "delete what I am looking at".
  const closeLoadedQuery = useCallback(() => {
    setLoaded(null);
    setLoadedForm(null);
    setBaseline(null);
  }, []);

  const onOpenQuery = useCallback(
    async (saved: SavedQuery) => {
      setLibraryOpen(false);
      await applyRestore(saved);
    },
    [applyRestore],
  );

  const onRevert = useCallback(() => {
    if (loaded) void applyRestore(loaded);
  }, [loaded, applyRestore]);

  const handleFailure = useCallback(
    async (res: Parameters<typeof describeSavedQueryError>[0]) => {
      const descriptor = describeSavedQueryError(res);
      setSaveError(descriptor);
      // A vanished row is not retried — an unknown id and someone else's personal row are the same
      // answer by design, so the only useful move is to re-read what still exists.
      if (descriptor.code === SavedQueryErrorCode.NotFound) {
        setLoaded(null);
        setLoadedForm(null);
        setBaseline(null);
        setDialogMode(null);
        await library.refreshAll();
      }
      return descriptor;
    },
    [library],
  );

  const onSubmitSave = useCallback(
    async (form: SaveQueryForm) => {
      setIsSaving(true);
      setSaveError(null);

      const isReplace = dialogMode === null || dialogMode === SaveQueryDialogMode.Rename;
      const request = toSavedQueryRequest(captureInput(form));
      const res = isReplace && loaded ? await updateSavedQuery(loaded.id, request) : await createSavedQuery(request);

      setIsSaving(false);

      if (!res.success) {
        await handleFailure(res);
        return;
      }

      const saved = res.response;
      if (saved) {
        setLoaded(saved);
        setLoadedForm(form);
        setBaseline(JSON.stringify(request));
      }
      setDialogMode(null);
      showNotification(getSuccessNotification(t(QueryBuilderI18nKey.SavedQuerySaved)));
      await library.refreshAll();
    },
    [dialogMode, loaded, captureInput, handleFailure, library, showNotification, t],
  );

  // Save overwrites in place once a query is loaded and the caller may write it; otherwise it opens
  // the dialog — as a copy when the loaded query is one they cannot overwrite.
  const onSave = useCallback(() => {
    setSaveError(null);
    if (loaded && loadedForm && canOverwrite) {
      void onSubmitSave(loadedForm);
      return;
    }
    setDialogMode(loaded ? SaveQueryDialogMode.SaveAsNew : SaveQueryDialogMode.Create);
  }, [loaded, loadedForm, canOverwrite, onSubmitSave]);

  // Edits the loaded query's name, description and tag without touching its stored body.
  const onEdit = useCallback(() => {
    setSaveError(null);
    setDialogMode(SaveQueryDialogMode.Rename);
  }, []);

  const onRequestDelete = useCallback(() => {
    setSaveError(null);
    setPendingDelete(loaded);
  }, [loaded]);

  // Shared by both entry points — the toolbar overflow (which deletes the loaded query) and the
  // library, where any row can be deleted without opening it first.
  const deleteQuery = useCallback(
    async (target: SavedQuery) => {
      const res = await deleteSavedQueryAction(target.id);
      if (!res.success) {
        const descriptor = await handleFailure(res);
        showNotification(getErrorNotification(t(descriptor.hintKey), res.errorMessage, res.requestId));
        return;
      }
      // Deleting the query currently open leaves the builder holding its content but no identity —
      // so the chip, the dirty bar and the overwrite target all have to go with it.
      if (loaded?.id === target.id) {
        setLoaded(null);
        setLoadedForm(null);
        setBaseline(null);
      }
      showNotification(getSuccessNotification(t(QueryBuilderI18nKey.SavedQueryDeleted)));
      await library.refreshAll();
    },
    [loaded, handleFailure, library, showNotification, t],
  );

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await deleteQuery(target);
  }, [pendingDelete, deleteQuery]);

  const dialogInitial = useMemo<SaveQueryForm>(() => {
    const base = loadedForm ?? emptyForm(SavedQueryScope.Personal);
    if (dialogMode === SaveQueryDialogMode.SaveAsNew) {
      // A copy always lands in the caller's own library — that is the point of Save as new for a
      // common query somebody else wrote.
      return { ...base, name: '', scope: SavedQueryScope.Personal };
    }
    if (dialogMode === SaveQueryDialogMode.Rename) return base;
    return {
      ...emptyForm(SavedQueryScope.Personal),
      saveAsChart: input.resultView === QueryResultView.Chart,
    };
  }, [dialogMode, loadedForm, input.resultView]);

  const tagSuggestions = useMemo(
    () => savedQueryTags(library.queriesFor(dialogInitial.scope)),
    [library, dialogInitial.scope],
  );

  return {
    library,
    loaded,
    isDirty,
    canOverwrite,
    libraryOpen,
    setLibraryOpen,
    dialogMode,
    setDialogMode,
    dialogInitial,
    tagSuggestions,
    currentTime,
    saveError,
    isSaving,
    pendingDelete,
    setPendingDelete,
    onOpenQuery,
    deleteQuery,
    closeLoadedQuery,
    onRevert,
    onSave,
    onSubmitSave,
    onEdit,
    onRequestDelete,
    onConfirmDelete,
    saveDisabled,
  };
};
