'use client';

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { deleteSavedQuery, updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import { QueryMetadataForm } from '@/src/components/Analytics/Queries/models';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  toBuilderRestore,
  toMetadataReplaceRequest,
  toSavedQueryRequest,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import {
  describeSavedQueryError,
  isSavedQueryGone,
  resolveSavedQueryErrorCode,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { DEFAULT_SAVED_QUERY_SCOPE, KNOWN_TIME_PERIODS } from '@/src/constants/analytics/queries';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { StructuredQuery } from '@/src/models/analytics/query';
import { ErrorI18nKey, QueriesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
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
  SavedQueryMetadata,
  SavedQueryRestore,
  SavedQueryScope,
  SavedQueryTimeAction,
  SavedQueryTimeIntentInput,
} from '@/src/models/analytics/saved-query';
import { NotificationType } from '@/src/models/notification';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

export interface SavedQueryPageInput {
  savedQuery?: SavedQuery;
  state: QueryBuilderState;
  setState: (state: QueryBuilderState) => void;
  sqlText: string;
  setSqlText: (value: string) => void;
  translatedSql?: string | null;
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

const DRAFT_METADATA: SavedQueryMetadata = { name: '', scope: DEFAULT_SAVED_QUERY_SCOPE };

export const useSavedQueryPage = (input: SavedQueryPageInput) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isFullAdmin } = useAppContext();

  const [savedQuery, setSavedQuery] = useState<SavedQuery | undefined>(input.savedQuery);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // `applyRestore` must not depend on `input`, or it would be rebuilt every render and the seed effect
  // would reset the builder while the user types. It therefore reads the current values through this
  // ref rather than closing over them — a plain closure would freeze on the first render's values.
  const inputRef = useRef(input);
  inputRef.current = input;
  const unloadedQuery = useRef<StructuredQuery | undefined>(void 0);
  const unloadedStateBody = useRef<string | null>(null);

  const heldQueryOf = useCallback(
    (state: QueryBuilderState): StructuredQuery | undefined =>
      unloadedQuery.current && JSON.stringify(buildQuery(state, null)) === unloadedStateBody.current
        ? unloadedQuery.current
        : void 0,
    [],
  );

  const isWritable = savedQuery?.scope !== SavedQueryScope.Common || isFullAdmin;

  // Recomputed every render rather than memoized: it derives from nine pieces of live state, so the
  // dependency list would be the state itself, and building the payload is a cheap object walk.
  const liveRequest = toSavedQueryRequest(captureFrom(savedQuery ?? DRAFT_METADATA, input, heldQueryOf(input.state)));

  const isDirty = !!baseline && JSON.stringify(liveRequest) !== baseline;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const applyRestore = useCallback(
    (saved: SavedQuery) => {
      const current = inputRef.current;
      const restore = toBuilderRestore({
        saved,
        fields: current.state.fields,
        functions: current.state.functions,
        knownPeriods: KNOWN_TIME_PERIODS,
        translatedSql: current.translatedSql,
      });
      unloadedQuery.current = restore.unloadedQuery;
      unloadedStateBody.current = restore.unloadedQuery ? JSON.stringify(buildQuery(restore.state, null)) : null;

      current.setState(restore.state);
      current.clearResult();
      current.setSqlText(restore.sqlText);
      current.lastGeneratedSql.current = '';
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
            fallbackQuery: restore.unloadedQuery,
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

  useEffect(() => {
    if (inputRef.current.savedQuery) return;
    setBaseline(JSON.stringify(toSavedQueryRequest(captureFrom(DRAFT_METADATA, inputRef.current, void 0))));
  }, []);

  const onSave = useCallback(async () => {
    if (!savedQuery) return;
    setIsSaving(true);
    let res: Awaited<ReturnType<typeof updateSavedQuery>>;
    try {
      res = await updateSavedQuery(savedQuery.id, liveRequest);
    } catch {
      // A transport failure carries no envelope to branch on; without this Save stayed disabled with
      // nothing reported. Same handling as the create modal.
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(QueriesI18nKey.ErrorGeneric)));
      return;
    } finally {
      setIsSaving(false);
    }

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
        router.refresh();
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
  const onEdited = useCallback(
    (next: SavedQuery) => {
      setSavedQuery(next);
      setBaseline(
        JSON.stringify(toSavedQueryRequest(captureFrom(next, inputRef.current, heldQueryOf(inputRef.current.state)))),
      );
    },
    [heldQueryOf],
  );

  // Reads through `inputRef`, so the callback stays stable and takes the live values at submit time.
  const buildSaveAsRequest = useCallback(
    (meta: QueryMetadataForm) =>
      savedQuery && !isDirtyRef.current
        ? toMetadataReplaceRequest(savedQuery, meta)
        : toSavedQueryRequest(captureFrom(meta, inputRef.current, heldQueryOf(inputRef.current.state))),
    [savedQuery, heldQueryOf],
  );

  // Leaves `savedQuery` and the baseline alone: the edits now also live in the new query, but against
  // the source they are still unsaved, so the page stays dirty and the user can keep iterating.
  const onSaveAsCreated = useCallback(
    (created: SavedQuery) => {
      setIsSaveAsOpen(false);
      showNotification(
        getNotification(
          NotificationType.success,
          getCreateNotificationTitle(ApplicationRoute.AnalyticsQueries, t),
          <>
            {t(QueriesI18nKey.SavedAsNewQuery)}{' '}
            <Link
              href={`/${currentLocale}${getUrnForEntity(ApplicationRoute.AnalyticsQueries, created)}`}
              className="text-accent-primary underline"
            >
              {created.name}
            </Link>
          </>,
        ),
      );
      router.refresh();
    },
    [showNotification, t, currentLocale, router],
  );

  const onRemove = useCallback((id: string) => deleteSavedQuery(decodeURIComponent(id)), []);

  return {
    savedQuery,
    isDraft: !savedQuery,
    hasUnloadedBody: !!heldQueryOf(input.state),
    isDirty,
    isWritable,
    isSaving,
    isEditOpen,
    onOpenEdit: () => setIsEditOpen(true),
    onCloseEdit: () => setIsEditOpen(false),
    onSave,
    onDiscard,
    onEdited,
    isSaveAsOpen,
    onOpenSaveAs: () => setIsSaveAsOpen(true),
    onCloseSaveAs: () => setIsSaveAsOpen(false),
    buildSaveAsRequest,
    onSaveAsCreated,
    isDeleteOpen,
    onOpenDelete: () => setIsDeleteOpen(true),
    onCloseDelete: () => setIsDeleteOpen(false),
    onRemove,
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
  unloaded: StructuredQuery | undefined,
): SavedQueryCaptureInput => ({
  name: meta.name,
  description: meta.description,
  tag: meta.tag,
  scope: meta.scope,
  state: current.state,
  // The SQL buffer is the authored body whenever it holds one, whatever view is open: keying this on
  // the active view let a SQL query be replaced by never-hydrated builder state on a view switch.
  sqlText: current.sqlText,
  fallbackQuery: unloaded,
  time: { period: current.timePeriod, isCustom: current.isCustom, range: current.timeRange },
  resultView: current.resultView,
  chartConfig: current.chartConfig,
});

const RESTORE_VIEWS: Record<SavedQueryEditor, QueryBuilderView> = {
  [SavedQueryEditor.Builder]: QueryBuilderView.Form,
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
