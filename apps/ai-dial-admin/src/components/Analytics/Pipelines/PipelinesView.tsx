'use client';

import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { GhostButton, PrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2, IconPlus } from '@tabler/icons-react';

import { deletePipeline, getPipelines } from '@/src/app/[lang]/pipelines/actions';
import CreatePipelinePopup from '@/src/components/Analytics/Pipelines/CreatePipelinePopup';
import { TransformCellRenderer } from '@/src/components/Analytics/Pipelines/Common/TransformCell';
import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import PipelineRuntimeBadge from '@/src/components/Analytics/Pipelines/Common/PipelineRuntimeBadge';
import { runtimeStatusOf, usePausedPipelines } from '@/src/components/Analytics/Pipelines/Common/use-paused-pipelines';
import { PipelineKindCellRenderer } from '@/src/components/Analytics/Pipelines/Common/PipelineKindCell';
import { TriggerCellRenderer } from '@/src/components/Analytics/Pipelines/Common/TriggerCell';
import DeletePipelinePopup from '@/src/components/Analytics/Pipelines/Common/DeletePipelinePopup';
import { pipelineDetailHref } from '@/src/components/Analytics/Pipelines/Common/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { useAppContext } from '@/src/context/AppContext';
import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { PIPELINES_NO_RUNTIME_STORAGE_KEY, PIPELINES_STORAGE_KEY } from '@/src/constants/analytics/pipelines';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { PipelineKind, PipelineListItem } from '@/src/models/analytics/pipeline';
import { ReadFailure, ServerActionResponse } from '@/src/models/server-action';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  initialPipelines: PipelineListItem[];
  loadFailure?: ReadFailure | null;
}

const PipelinesView: FC<Props> = ({ initialPipelines, loadFailure }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isFullAdmin } = useAppContext();
  // One read for the page: the runner answers with every paused pipeline at once and offers no
  // per-pipeline read, so a request per row would ask for an answer already given whole.
  const runtime = usePausedPipelines();

  const [pipelines, setPipelines] = useState<PipelineListItem[]>(initialPipelines);
  const [deleteTarget, setDeleteTarget] = useState<PipelineListItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isColumnsPanelOpen, setIsColumnsPanelOpen] = useState(false);

  const onToggleColumnsPanel = useCallback(() => setIsColumnsPanelOpen((isOpen) => !isOpen), []);

  useReadFailureNotification(loadFailure, AnalyticsPipelinesI18nKey.PipelinesLoadFailed);

  // Responses can land out of order — a slow filter answering after a faster later one would put rows
  // on screen that contradict the toolbar. Only the newest request is allowed to write.
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    const reportFailure = (failure?: ServerActionResponse) => {
      showNotification(
        getErrorNotification(
          failure?.errorHeader ?? t(AnalyticsPipelinesI18nKey.PipelinesLoadFailed),
          failure?.errorMessage,
          failure?.requestId,
        ),
      );
    };

    try {
      const result = await getPipelines();

      if (requestId !== requestIdRef.current) return;

      if (result.success) {
        const next = result.response ?? [];
        setPipelines(next);
        // The button goes with the last row; a panel left open would reappear on its own with the next one.
        if (!next.length) setIsColumnsPanelOpen(false);
        return;
      }
      reportFailure(result);
    } catch {
      if (requestId === requestIdRef.current) {
        reportFailure();
      }
    }
  }, [showNotification, t]);

  const notifyFailed = useCallback(
    (errorHeader?: string, errorMessage?: string, requestId?: string) =>
      showNotification(
        getErrorNotification(errorHeader || t(AnalyticsPipelinesI18nKey.ActionFailed), errorMessage, requestId),
      ),
    [showNotification, t],
  );

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;

    const { name } = deleteTarget;
    setDeleteTarget(null);

    const res = await deletePipeline(name);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.Deleted)));
      void reload();
    } else {
      notifyFailed(res.errorHeader, res.errorMessage, res.requestId);
    }
  };

  const rowActions: ActionMenuOperationDeclaration<PipelineListItem>[] = useMemo(
    () => [
      getDeleteOperation<PipelineListItem>(
        (pipeline) => pipeline && setDeleteTarget(pipeline),
        () => !isFullAdmin,
      ),
    ],
    [isFullAdmin],
  );

  const columns: ColDef[] = useMemo(() => {
    // The service's ordering is total, so client-side re-sorting would present an order the response
    // never had.
    //
    // Every column sets `field` equal to its `colId`: the columns panel addresses a column by `field` and
    // the grid's saved state by `colId`, so a column keyed by one alone could be listed but never toggled.
    // Where that field resolves to a raw row value the cell renders as something else, the default
    // tooltip is suppressed so the raw value is not repeated over the rendered badge. The leading seven
    // are shown by default; the rest stay available in the columns panel.
    const dataColumns: ColDef[] = [
      { headerName: t(AnalyticsPipelinesI18nKey.Name), field: 'name', colId: 'name', flex: 2 },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Kind),
        field: 'kind',
        colId: 'kind',
        flex: 1,
        cellDataType: false,
        cellRenderer: PipelineKindCellRenderer,
        tooltipValueGetter: () => undefined,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Trigger),
        field: 'trigger',
        colId: 'trigger',
        flex: 2,
        cellDataType: false,
        // `trigger` is an object, which the grid's comparator cannot order; sort and filter on its kind.
        valueGetter: (params) => (params.data as PipelineListItem | undefined)?.trigger?.kind,
        cellRenderer: TriggerCellRenderer,
        tooltipValueGetter: () => undefined,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.SectionTransform),
        field: 'transform',
        colId: 'transform',
        flex: 2,
        cellDataType: false,
        cellRenderer: TransformCellRenderer,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Enabled),
        field: 'enabled',
        colId: 'enabled',
        flex: 1,
        cellDataType: false,
        cellRenderer: ({ data }: ICellRendererParams<PipelineListItem>) => (
          <PipelineEnabledBadge enabled={data?.enabled} />
        ),
        tooltipValueGetter: () => undefined,
      },
      // Withheld whole rather than filled with identical failures: a column of them states nothing
      // about any row and implies a per-row fact the page does not have.
      ...(runtime.isRead
        ? [
            {
              headerName: t(AnalyticsPipelinesI18nKey.Runtime),
              field: 'runtime',
              colId: 'runtime',
              flex: 1,
              cellDataType: false,
              // A disabled pipeline has no runtime answer — the runner is not driving it at all, and
              // "not running" would read as a fault where there is a configuration.
              cellRenderer: ({ data }: ICellRendererParams<PipelineListItem>) =>
                data?.enabled ? (
                  <PipelineRuntimeBadge status={runtimeStatusOf(runtime, data.name, data.enabled, data.kind)} />
                ) : (
                  UNAVAILABLE_VALUE
                ),
            },
          ]
        : []),
      { headerName: t(AnalyticsPipelinesI18nKey.Generation), field: 'generation', colId: 'generation', flex: 1 },
      { headerName: t(AnalyticsPipelinesI18nKey.Target), field: 'target', colId: 'target', flex: 2, hide: true },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Inputs),
        field: 'inputs',
        colId: 'inputs',
        flex: 2,
        hide: true,
        // An enrichment pipeline that declares no input is not one without a source — it reads whatever
        // its target enrichment reads. An em dash said the opposite; the resolved table itself is on the
        // pipeline's own page, which is the only read that resolves it.
        valueGetter: (params) => {
          const row = params.data as PipelineListItem | undefined;
          if (row?.inputs?.length) return row.inputs.join(', ');
          return row?.kind === PipelineKind.Enrich
            ? t(AnalyticsPipelinesI18nKey.SourceFollowsTarget)
            : UNAVAILABLE_VALUE;
        },
        tooltipValueGetter: () => undefined,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.UpdatedAt),
        field: 'updatedAt',
        colId: 'updatedAt',
        flex: 2,
        hide: true,
        valueGetter: (params) => formatDateTimeToLocalString((params.data as PipelineListItem | undefined)?.updated_at),
      },
    ];

    return [...dataColumns, ACTION_COLUMN(rowActions)];
  }, [t, rowActions, runtime]);

  return (
    <div className="relative flex w-full flex-1 flex-col min-h-0 rounded bg-layer-2 p-4">
      <div className="mb-8 flex h-[40px] flex-row items-center justify-between gap-4">
        <h1>{t(MenuI18nKey.Pipelines)}</h1>
        <div className="flex items-center gap-4">
          {/* The grid does not mount the panel over its empty state, so there is nothing to configure. */}
          {pipelines.length > 0 && (
            <GhostButton
              label={t(ButtonsI18nKey.Columns)}
              iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              aria-pressed={isColumnsPanelOpen}
              onClick={onToggleColumnsPanel}
            />
          )}
          {isFullAdmin && (
            <PrimaryButton
              label={t(AnalyticsPipelinesI18nKey.CreatePipeline)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => setIsCreateOpen(true)}
            />
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <GridView
          columnDefs={columns}
          rowData={pipelines}
          getRowId={(params) => params.data.name}
          additionalGridOptions={{
            onCellClicked: (e) => {
              if (e.colDef.field === ACTIONS_COLUMN_CEL_ID || !e.data) return;
              navigateEntityUrl(pipelineDetailHref(e.data.name), router.push, e.event as MouseEvent | undefined);
            },
          }}
          emptyDataProps={{ title: t(AnalyticsPipelinesI18nKey.NoPipelines) }}
          storageKey={runtime.isRead ? PIPELINES_STORAGE_KEY : PIPELINES_NO_RUNTIME_STORAGE_KEY}
          showColumnsPanel={isColumnsPanelOpen}
          toggleColumnsPanel={onToggleColumnsPanel}
        />
      </div>

      {deleteTarget && (
        <DeletePipelinePopup
          name={deleteTarget.name}
          kind={deleteTarget.kind}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {isCreateOpen && (
        <CreatePipelinePopup
          takenTargets={pipelines.map((pipeline) => pipeline.target)}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void reload()}
        />
      )}
    </div>
  );
};

export default PipelinesView;
