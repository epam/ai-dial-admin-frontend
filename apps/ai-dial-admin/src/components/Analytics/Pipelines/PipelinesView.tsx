'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams } from 'ag-grid-community';
import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialEllipsisTooltip,
  DialPrimaryButton,
} from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { deletePipeline, getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import CreatePipelinePopup from '@/src/components/Analytics/Pipelines/CreatePipelinePopup';
import { EvaluatorCellRenderer } from '@/src/components/Analytics/Pipelines/Common/EvaluatorCell';
import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import { PipelineKindCellRenderer } from '@/src/components/Analytics/Pipelines/Common/PipelineKindCell';
import { TriggerCellRenderer } from '@/src/components/Analytics/Pipelines/Common/TriggerCell';
import { pipelineDetailHref } from '@/src/components/Analytics/Pipelines/Common/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { useAppContext } from '@/src/context/AppContext';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsPipelinesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { PipelineListItem } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  initialPipelines: PipelineListItem[];
  functions?: QueryFunction[];
  hasLoadError?: boolean;
}

const PipelinesView: FC<Props> = ({ initialPipelines, functions = [], hasLoadError }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isFullAdmin } = useAppContext();

  const [pipelines, setPipelines] = useState<PipelineListItem[]>(initialPipelines);
  const [hasPipelinesError, setHasPipelinesError] = useState(Boolean(hasLoadError));
  const [deleteTarget, setDeleteTarget] = useState<PipelineListItem | null>(null);
  const [evaluators, setEvaluators] = useState<EvaluatorSummary[]>([]);
  const [hasEvaluatorsError, setHasEvaluatorsError] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Responses can land out of order — a slow filter answering after a faster later one would put rows
  // on screen that contradict the toolbar. Only the newest request is allowed to write.
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const result = await getPipelines();

      if (requestId !== requestIdRef.current) return;

      if (result.data) {
        setPipelines(result.data);
        setHasPipelinesError(false);
        return;
      }
      setHasPipelinesError(true);
      showNotification(getErrorNotification(t(AnalyticsPipelinesI18nKey.PipelinesLoadFailed)));
    } catch {
      if (requestId === requestIdRef.current) {
        setHasPipelinesError(true);
        showNotification(getErrorNotification(t(AnalyticsPipelinesI18nKey.PipelinesLoadFailed)));
      }
    }
  }, [showNotification, t]);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const list = await getEvaluators();
        if (isCancelled) return;

        if (Array.isArray(list)) {
          setEvaluators(list);
        } else {
          setHasEvaluatorsError(true);
        }
      } catch {
        if (!isCancelled) setHasEvaluatorsError(true);
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, []);

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
    const dataColumns: ColDef[] = [
      { headerName: t(AnalyticsPipelinesI18nKey.Name), field: 'name', flex: 2 },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Kind),
        colId: 'kind',
        flex: 1,
        cellDataType: false,
        cellRenderer: PipelineKindCellRenderer,
      },
      { headerName: t(AnalyticsPipelinesI18nKey.Target), field: 'target', flex: 2 },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Inputs),
        colId: 'inputs',
        flex: 2,
        valueGetter: (params) => (params.data as PipelineListItem | undefined)?.inputs?.join(', ') ?? UNAVAILABLE_VALUE,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Trigger),
        colId: 'trigger',
        flex: 2,
        cellDataType: false,
        cellRenderer: TriggerCellRenderer,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Evaluator),
        colId: 'evaluator',
        flex: 2,
        cellDataType: false,
        cellRenderer: EvaluatorCellRenderer,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Enabled),
        colId: 'enabled',
        flex: 1,
        cellDataType: false,
        cellRenderer: ({ data }: ICellRendererParams<PipelineListItem>) => (
          <PipelineEnabledBadge enabled={data?.enabled} />
        ),
      },
      { headerName: t(AnalyticsPipelinesI18nKey.Generation), field: 'generation', flex: 1 },
      {
        headerName: t(AnalyticsPipelinesI18nKey.UpdatedAt),
        colId: 'updatedAt',
        flex: 2,
        valueGetter: (params) => formatDateTimeToLocalString((params.data as PipelineListItem | undefined)?.updated_at),
      },
    ];

    return [...dataColumns, ACTION_COLUMN(rowActions)];
  }, [t, rowActions]);

  return (
    <div className="relative flex w-full flex-1 flex-col min-h-0 rounded bg-layer-2 p-4">
      <div className="mb-8 flex h-[40px] flex-row items-center justify-between gap-4">
        <h1>{t(MenuI18nKey.Pipelines)}</h1>
        {isFullAdmin && (
          <DialPrimaryButton
            label={t(AnalyticsPipelinesI18nKey.CreatePipeline)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsCreateOpen(true)}
          />
        )}
      </div>

      {hasPipelinesError && (
        <div role="status" className="mb-4 text-error dial-small">
          {t(AnalyticsPipelinesI18nKey.PipelinesLoadFailed)}
        </div>
      )}

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
        />
      </div>

      {deleteTarget && (
        <DialConfirmationPopup
          open={!!deleteTarget}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsPipelinesI18nKey.DeleteConfirmTitle)}
          description={
            <div className="flex flex-col gap-y-2">
              <span>{t(AnalyticsPipelinesI18nKey.DeleteConfirmDescription)}</span>
              <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
                <span className="shrink-0 text-secondary">{t(AnalyticsPipelinesI18nKey.Name)}:</span>
                <DialEllipsisTooltip text={deleteTarget.name} />
              </div>
            </div>
          }
          confirmLabel={t(AnalyticsPipelinesI18nKey.DeletePipeline)}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {isCreateOpen && (
        <CreatePipelinePopup
          evaluators={evaluators}
          hasEvaluatorsError={hasEvaluatorsError}
          functions={functions}
          takenTargets={pipelines.map((pipeline) => pipeline.target)}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void reload()}
        />
      )}
    </div>
  );
};

export default PipelinesView;
