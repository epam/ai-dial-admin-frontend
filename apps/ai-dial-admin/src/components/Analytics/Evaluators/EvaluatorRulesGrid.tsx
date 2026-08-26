'use client';

import { FC, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams } from 'ag-grid-community';

import RuleEnabledBadge from '@/src/components/Analytics/EnrichmentRules/RuleEnabledBadge';
import { TriggerCellRenderer } from '@/src/components/Analytics/EnrichmentRules/TriggerCell';
import { isPinnedToLatest, ruleDetailHref } from '@/src/components/Analytics/EnrichmentRules/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { AnalyticsEnrichmentRulesI18nKey, AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  rules: EnrichmentRuleListItem[] | null;
}

const EvaluatorRulesGrid: FC<Props> = ({ rules }) => {
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
        headerName: t(AnalyticsEnrichmentRulesI18nKey.Trigger),
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
          const rule = params.data as EnrichmentRuleListItem | undefined;
          if (!rule) return '';
          const version = rule.evaluator.version;
          return isPinnedToLatest(rule.evaluator_version)
            ? `${version} · ${t(AnalyticsEnrichmentRulesI18nKey.Latest)}`
            : String(version);
        },
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
      {
        headerName: t(AnalyticsEnrichmentRulesI18nKey.UpdatedAt),
        colId: 'updatedAt',
        flex: 2,
        valueGetter: (params) =>
          formatDateTimeToLocalString((params.data as EnrichmentRuleListItem | undefined)?.updated_at),
      },
    ],
    [t],
  );

  if (rules == null) {
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
        rowData={rules}
        getRowId={(params) => params.data.id}
        additionalGridOptions={{
          onCellClicked: (e) => {
            if (!e.data) return;
            navigateEntityUrl(ruleDetailHref(e.data.id), router.push, e.event as MouseEvent | undefined);
          },
        }}
        emptyDataProps={{ title: t(AnalyticsEvaluatorsI18nKey.UsedByNone) }}
      />
    </div>
  );
};

export default EvaluatorRulesGrid;
