'use client';

import { FC, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams } from 'ag-grid-community';

import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import { TriggerCellRenderer } from '@/src/components/Analytics/Pipelines/Common/TriggerCell';
import { isPinnedToLatest, pipelineDetailHref } from '@/src/components/Analytics/Pipelines/Common/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { AnalyticsPipelinesI18nKey, AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineListItem } from '@/src/models/analytics/pipeline';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  pipelines: PipelineListItem[] | null;
}

const EvaluatorPipelinesGrid: FC<Props> = ({ pipelines }) => {
  const t = useI18n();
  const router = useRouter();

  const columns: ColDef[] = useMemo(
    () => [
      { headerName: t(AnalyticsEvaluatorsI18nKey.Name), field: 'name', flex: 2 },
      {
        headerName: t(AnalyticsEvaluatorsI18nKey.RuleTargetEnrichment),
        field: 'target_enrichment',
        flex: 2,
      },
      {
        headerName: t(AnalyticsPipelinesI18nKey.Trigger),
        colId: 'trigger',
        flex: 2,
        cellDataType: false,
        cellRenderer: TriggerCellRenderer,
      },
      {
        headerName: t(AnalyticsEvaluatorsI18nKey.RuleResolvedVersion),
        colId: 'resolvedVersion',
        flex: 1,
        valueGetter: (params) => {
          const pipeline = params.data as PipelineListItem | undefined;
          if (!pipeline?.evaluator) return '';
          const version = pipeline.evaluator.version;
          return isPinnedToLatest(pipeline.evaluator_version)
            ? `${version} · ${t(AnalyticsPipelinesI18nKey.Latest)}`
            : String(version);
        },
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
      {
        headerName: t(AnalyticsPipelinesI18nKey.UpdatedAt),
        colId: 'updatedAt',
        flex: 2,
        valueGetter: (params) => formatDateTimeToLocalString((params.data as PipelineListItem | undefined)?.updated_at),
      },
    ],
    [t],
  );

  if (pipelines == null) {
    return (
      <div role="status" className="text-error dial-small">
        {t(AnalyticsEvaluatorsI18nKey.UsedByLoadFailed)}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GridView
        columnDefs={columns}
        rowData={pipelines}
        getRowId={(params) => params.data.name}
        additionalGridOptions={{
          onCellClicked: (e) => {
            if (!e.data) return;
            navigateEntityUrl(pipelineDetailHref(e.data.name), router.push, e.event as MouseEvent | undefined);
          },
        }}
        emptyDataProps={{ title: t(AnalyticsEvaluatorsI18nKey.UsedByNone) }}
      />
    </div>
  );
};

export default EvaluatorPipelinesGrid;
