'use client';

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import { toBuilderRestore, toSavedQueryRequest } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import {
  describeSavedQueryError,
  isSavedQueryGone,
  resolveSavedQueryErrorCode,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { KNOWN_TIME_PERIODS } from '@/src/constants/analytics/queries';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import {
  ChartConfig,
  QueryBuilderState,
  QueryBuilderView,
  QueryResultView,
} from '@/src/models/analytics/query-builder';
import {
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryEditor,
  SavedQueryRestore,
  SavedQueryScope,
  SavedQueryTimeAction,
  SavedQueryTimeIntentInput,
} from '@/src/models/analytics/saved-query';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

export interface SavedQueryPageInput {
  savedQuery?: SavedQuery;
  state: QueryBuilderState;
  setState: (state: QueryBuilderState) => void;
  sqlText: string;
  setSqlText: (value: string) => void;
  jsonText: string;
  setJsonText: (value: string) => void;
  // True when the JSON buffer holds a valid body the visual builder cannot display. The builder state is
  // not hydrated from it, so the buffer itself has to reach the payload.
  isJsonDiverged: boolean;
  setJsonDiverged: (value: boolean) => void;
  setView: (view: QueryBuilderView) => void;
  lastGeneratedSql: MutableRefObject<string>;
  isSqlView: boolean;
  timePeriod: string;
  isCustom: boolean;
  timeRange: TimeRange;
  onTimePeriodChange: (period: string) => void;
  onTimeRangeChange: (range: TimeRange, isCustom?: boolean) => void;
  resultView: QueryResultView;
  setResultView: (view: QueryResultView) => void;
  chartConfig: ChartConfig;
  setChartConfig: (config: ChartConfig) => void;
  isChartConfigKept: MutableRefObject<boolean>;
  clearResult: () => void;
}

export const useSavedQueryPage = (input: SavedQueryPageInput) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isFullAdmin } = useAppContext();

  const [savedQuery, setSavedQuery] = useState<SavedQuery | undefined>(input.savedQuery);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // `applyRestore` must not depend on `input`, or it would be rebuilt every render and the seed effect
  // would reset the builder while the user types. It therefore reads the current values through this
  // ref rather than closing over them — a plain closure would freeze on the first render's values.
  const inputRef = useRef(input);
  inputRef.current = input;

  const isWritable = savedQuery?.scope !== SavedQueryScope.Common || isFullAdmin;

  // Recomputed every render rather than memoized: it derives from nine pieces of live state, so the
  // dependency list would be the state itself, and building the payload is a cheap object walk.
  const liveRequest = savedQuery ? toSavedQueryRequest(captureFrom(savedQuery, input)) : null;

  const isDirty = !!baseline && !!liveRequest && JSON.stringify(liveRequest) !== baseline;

  const applyRestore = useCallback(
    (saved: SavedQuery) => {
      const current = inputRef.current;
      const restore = toBuilderRestore({
        saved,
        fields: current.state.fields,
        functions: current.state.functions,
        knownPeriods: KNOWN_TIME_PERIODS,
      });

      current.setState(restore.state);
      current.clearResult();
      current.setSqlText(restore.sqlText);
      current.lastGeneratedSql.current = '';
      current.setJsonText(restore.jsonText);
      current.setJsonDiverged(restore.editor === SavedQueryEditor.Json);
      current.setView(RESTORE_VIEWS[restore.editor]);
      current.setResultView(restore.resultView);
      if (restore.chartConfig) {
        current.setChartConfig(restore.chartConfig);
        current.isChartConfigKept.current = true;
      }

      const time = applyTimeRestore(restore, current);
      setBaseline(
        JSON.stringify(
          toSavedQueryRequest({
            name: saved.name,
            description: saved.description,
            tag: saved.tag,
            scope: saved.scope,
            state: restore.state,
            sqlText: restore.sqlText,
            divergedJsonText: restore.editor === SavedQueryEditor.Json ? restore.jsonText : null,
            time,
            resultView: restore.resultView,
            chartConfig: restore.chartConfig ?? DEFAULT_CHART_CONFIG,
          }),
        ),
      );
    },
    // Reads live values through `inputRef`, so it depends on nothing and stays stable — which is what
    // lets the seed effect below key on the query alone instead of firing on every render.
    [],
  );

  // Keyed on the id alone: a save bumps `generation` and replaces the object, and re-seeding then would
  // reload the builder from the response — clearing the result on screen and undoing a retargeted source.
  // `onSave` and `onEdited` move the baseline instead.
  useEffect(() => {
    if (savedQuery) applyRestore(savedQuery);
    // Deliberately keyed on the id, not on `savedQuery` itself, which exhaustive-deps cannot express.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedQuery?.id, applyRestore]);

  const onSave = useCallback(async () => {
    if (!savedQuery || !liveRequest) return;
    setIsSaving(true);
    const res = await updateSavedQuery(savedQuery.id, liveRequest);
    setIsSaving(false);

    if (!res.success) {
      const descriptor = describeSavedQueryError(res);
      showNotification(
        getErrorNotification(
          res.errorHeader,
          descriptor.isServerMessageShown ? res.errorMessage : t(descriptor.hintKey),
          res.requestId,
        ),
      );
      if (isSavedQueryGone(resolveSavedQueryErrorCode(res))) {
        router.push(ApplicationRoute.AnalyticsQueries);
      }
      return;
    }

    showNotification(
      getSuccessNotification(
        getUpdateNotificationTitle(ApplicationRoute.AnalyticsQueries, t),
        getUpdateNotificationDescription(ApplicationRoute.AnalyticsQueries, savedQuery.id, t),
      ),
    );
    setSavedQuery(res.response as SavedQuery);
    setBaseline(JSON.stringify(liveRequest));
    router.refresh();
  }, [savedQuery, liveRequest, showNotification, t, router]);

  const onDiscard = useCallback(() => {
    if (savedQuery) applyRestore(savedQuery);
  }, [applyRestore, savedQuery]);

  // Metadata is part of the payload, so a rename shifts the baseline too — without this the page would
  // report unsaved changes the moment the edit modal closed.
  const onEdited = useCallback((next: SavedQuery) => {
    setSavedQuery(next);
    setBaseline(JSON.stringify(toSavedQueryRequest(captureFrom(next, inputRef.current))));
  }, []);

  return {
    savedQuery,
    isDirty,
    isWritable,
    isSaving,
    isEditOpen,
    onOpenEdit: () => setIsEditOpen(true),
    onCloseEdit: () => setIsEditOpen(false),
    onSave,
    onDiscard,
    onEdited,
  };
};

/**
 * The payload the page would save right now: the stored query's metadata over the live builder state.
 * One shape for the live comparison, the post-save baseline, and the post-rename baseline, so none of
 * the three can describe the payload differently from the other two.
 */
const captureFrom = (
  meta: Pick<SavedQuery, 'name' | 'description' | 'tag' | 'scope'>,
  current: SavedQueryPageInput,
): SavedQueryCaptureInput => ({
  name: meta.name,
  description: meta.description,
  tag: meta.tag,
  scope: meta.scope,
  state: current.state,
  // The SQL buffer is the authored body whenever it holds one, whatever view is open: keying this on
  // the active view let a SQL query be replaced by never-hydrated builder state on a view switch.
  sqlText: current.sqlText,
  divergedJsonText: current.isJsonDiverged ? current.jsonText : null,
  time: { period: current.timePeriod, isCustom: current.isCustom, range: current.timeRange },
  resultView: current.resultView,
  chartConfig: current.chartConfig,
});

const RESTORE_VIEWS: Record<SavedQueryEditor, QueryBuilderView> = {
  [SavedQueryEditor.Builder]: QueryBuilderView.Form,
  [SavedQueryEditor.Json]: QueryBuilderView.Json,
  [SavedQueryEditor.Sql]: QueryBuilderView.Sql,
};

const applyTimeRestore = (restore: SavedQueryRestore, input: SavedQueryPageInput): SavedQueryTimeIntentInput => {
  if (restore.time.action === SavedQueryTimeAction.ApplyPeriod && restore.time.period) {
    input.onTimePeriodChange(restore.time.period);
    return { period: restore.time.period, isCustom: false, range: input.timeRange };
  }

  if (restore.time.action === SavedQueryTimeAction.ApplyRange && restore.time.range) {
    input.onTimeRangeChange(restore.time.range, true);
    return { period: input.timePeriod, isCustom: true, range: restore.time.range };
  }

  return { period: input.timePeriod, isCustom: input.isCustom, range: input.timeRange };
};
