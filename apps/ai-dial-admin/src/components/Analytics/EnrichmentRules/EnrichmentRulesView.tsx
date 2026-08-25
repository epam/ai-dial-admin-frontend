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

import { deleteRule, getEvaluators, getRules } from '@/src/app/[lang]/enrichment-rules/actions';
import CreateRulePopup from '@/src/components/Analytics/EnrichmentRules/CreateRulePopup';
import { EvaluatorCellRenderer } from '@/src/components/Analytics/EnrichmentRules/EvaluatorCell';
import RuleEnabledBadge from '@/src/components/Analytics/EnrichmentRules/RuleEnabledBadge';
import { TriggerCellRenderer } from '@/src/components/Analytics/EnrichmentRules/TriggerCell';
import { ruleDetailHref } from '@/src/components/Analytics/EnrichmentRules/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { useAppContext } from '@/src/context/AppContext';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsEnrichmentRulesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  initialRules: EnrichmentRuleListItem[];
  hasLoadError?: boolean;
}

const EnrichmentRulesView: FC<Props> = ({ initialRules, hasLoadError }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isFullAdmin } = useAppContext();

  const [rules, setRules] = useState<EnrichmentRuleListItem[]>(initialRules);
  const [hasRulesError, setHasRulesError] = useState(Boolean(hasLoadError));
  const [deleteTarget, setDeleteTarget] = useState<EnrichmentRuleListItem | null>(null);
  const [evaluators, setEvaluators] = useState<EvaluatorSummary[]>([]);
  const [hasEvaluatorsError, setHasEvaluatorsError] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Responses can land out of order — a slow filter answering after a faster later one would put rows
  // on screen that contradict the toolbar. Only the newest request is allowed to write.
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const list = await getRules();

      if (requestId !== requestIdRef.current) return;

      if (Array.isArray(list)) {
        setRules(list);
        setHasRulesError(false);
        return;
      }
      setHasRulesError(true);
      showNotification(getErrorNotification(t(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)));
    } catch {
      if (requestId === requestIdRef.current) {
        setHasRulesError(true);
        showNotification(getErrorNotification(t(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)));
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
        getErrorNotification(errorHeader || t(AnalyticsEnrichmentRulesI18nKey.ActionFailed), errorMessage, requestId),
      ),
    [showNotification, t],
  );

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;

    const { id } = deleteTarget;
    setDeleteTarget(null);

    const res = await deleteRule(id);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsEnrichmentRulesI18nKey.Deleted)));
      void reload();
    } else {
      notifyFailed(res.errorHeader, res.errorMessage, res.requestId);
    }
  };

  const rowActions: ActionMenuOperationDeclaration<EnrichmentRuleListItem>[] = useMemo(
    () => [
      getDeleteOperation<EnrichmentRuleListItem>(
        (rule) => rule && setDeleteTarget(rule),
        () => !isFullAdmin,
      ),
    ],
    [isFullAdmin],
  );

  const columns: ColDef[] = useMemo(() => {
    // The service's ordering is total, so client-side re-sorting would present an order the response
    // never had.
    const dataColumns: ColDef[] = [
      { headerName: t(AnalyticsEnrichmentRulesI18nKey.Name), field: 'name', flex: 2 },
      { headerName: t(AnalyticsEnrichmentRulesI18nKey.TargetEnrichment), field: 'target_enrichment', flex: 2 },
      { headerName: t(AnalyticsEnrichmentRulesI18nKey.Source), field: 'source', flex: 2 },
      {
        headerName: t(AnalyticsEnrichmentRulesI18nKey.Trigger),
        colId: 'trigger',
        flex: 2,
        cellDataType: false,
        cellRenderer: TriggerCellRenderer,
      },
      {
        headerName: t(AnalyticsEnrichmentRulesI18nKey.Evaluator),
        colId: 'evaluator',
        flex: 2,
        cellDataType: false,
        cellRenderer: EvaluatorCellRenderer,
      },
      { headerName: t(AnalyticsEnrichmentRulesI18nKey.GrainKey), field: 'grain_key', flex: 1 },
      {
        headerName: t(AnalyticsEnrichmentRulesI18nKey.VersionColumn),
        colId: 'versionColumn',
        flex: 1,
        valueGetter: (params) =>
          (params.data as EnrichmentRuleListItem | undefined)?.version_column ?? UNAVAILABLE_VALUE,
      },
      {
        headerName: t(AnalyticsEnrichmentRulesI18nKey.Enabled),
        colId: 'enabled',
        flex: 1,
        cellDataType: false,
        cellRenderer: ({ data }: ICellRendererParams<EnrichmentRuleListItem>) => (
          <RuleEnabledBadge enabled={data?.enabled} />
        ),
      },
      { headerName: t(AnalyticsEnrichmentRulesI18nKey.Generation), field: 'generation', flex: 1 },
      {
        headerName: t(AnalyticsEnrichmentRulesI18nKey.UpdatedAt),
        colId: 'updatedAt',
        flex: 2,
        valueGetter: (params) =>
          formatDateTimeToLocalString((params.data as EnrichmentRuleListItem | undefined)?.updated_at),
      },
    ];

    return [...dataColumns, ACTION_COLUMN(rowActions)];
  }, [t, rowActions]);

  return (
    <div className="relative flex w-full flex-1 flex-col min-h-0 rounded bg-layer-2 p-4">
      <div className="mb-8 flex h-[40px] flex-row items-center justify-between gap-4">
        <h1>{t(MenuI18nKey.EnrichmentRules)}</h1>
        {isFullAdmin && (
          <DialPrimaryButton
            label={t(AnalyticsEnrichmentRulesI18nKey.CreateRule)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsCreateOpen(true)}
          />
        )}
      </div>

      {hasRulesError && (
        <div role="status" className="mb-4 text-error dial-small">
          {t(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <GridView
          columnDefs={columns}
          rowData={rules}
          getRowId={(params) => params.data.id}
          additionalGridOptions={{
            onCellClicked: (e) => {
              if (e.colDef.field === ACTIONS_COLUMN_CEL_ID || !e.data) return;
              navigateEntityUrl(ruleDetailHref(e.data.id), router.push, e.event as MouseEvent | undefined);
            },
          }}
          emptyDataProps={{ title: t(AnalyticsEnrichmentRulesI18nKey.NoRules) }}
        />
      </div>

      {deleteTarget && (
        <DialConfirmationPopup
          open={!!deleteTarget}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsEnrichmentRulesI18nKey.DeleteConfirmTitle)}
          description={
            <div className="flex flex-col gap-y-2">
              <span>{t(AnalyticsEnrichmentRulesI18nKey.DeleteConfirmDescription)}</span>
              <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
                <span className="shrink-0 text-secondary">{t(AnalyticsEnrichmentRulesI18nKey.Name)}:</span>
                <DialEllipsisTooltip text={deleteTarget.name} />
              </div>
            </div>
          }
          confirmLabel={t(AnalyticsEnrichmentRulesI18nKey.DeleteRule)}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {isCreateOpen && (
        <CreateRulePopup
          evaluators={evaluators}
          hasEvaluatorsError={hasEvaluatorsError}
          takenTargets={rules.map((rule) => rule.target_enrichment)}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void reload()}
        />
      )}
    </div>
  );
};

export default EnrichmentRulesView;
