'use client';

import { FC, useMemo } from 'react';

import { ColDef } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { AnalyticsEvaluatorsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorListRow } from '@/src/models/analytics/evaluator';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  rows: EvaluatorListRow[];
  hasUsageError?: boolean;
  hasLoadError?: boolean;
}

const EvaluatorsView: FC<Props> = ({ rows, hasUsageError, hasLoadError }) => {
  const t = useI18n();

  // No type column: the listing endpoint reports no type, and both ways of filling one mislead — a per-row
  // version read, or a join from the rules listing that leaves every unreferenced evaluator blank, where an
  // em dash reads as "no type" rather than "no rule". Type is on the detail page.
  const columns: ColDef[] = useMemo(
    () => [
      { headerName: t(AnalyticsEvaluatorsI18nKey.Name), field: 'name', flex: 2 },
      { headerName: t(AnalyticsEvaluatorsI18nKey.LatestVersion), field: 'latest_version', flex: 1 },
      {
        headerName: t(AnalyticsEvaluatorsI18nKey.RegisteredAt),
        colId: 'registeredAt',
        flex: 2,
        valueGetter: (params) =>
          formatDateTimeToLocalString((params.data as EvaluatorListRow | undefined)?.created_at) || UNAVAILABLE_VALUE,
      },
      {
        headerName: t(AnalyticsEvaluatorsI18nKey.UsedBy),
        colId: 'usedBy',
        flex: 1,
        cellDataType: false,
        valueGetter: (params) => {
          const usedBy = (params.data as EvaluatorListRow | undefined)?.usedBy;
          return usedBy == null ? t(AnalyticsEvaluatorsI18nKey.UsedByUnknown) : usedBy;
        },
      },
    ],
    [t],
  );

  return (
    <div className="relative flex w-full flex-1 flex-col min-h-0 rounded bg-layer-2 p-4">
      <div className="mb-8 flex h-[40px] flex-row items-center justify-between gap-4">
        <h1>{t(MenuI18nKey.Evaluators)}</h1>
      </div>

      {hasLoadError && (
        <div role="status" className="mb-4 text-error dial-small">
          {t(AnalyticsEvaluatorsI18nKey.EvaluatorsLoadFailed)}
        </div>
      )}

      {hasUsageError && (
        <div role="status" className="mb-4 text-secondary dial-small">
          {t(AnalyticsEvaluatorsI18nKey.UsageLoadFailed)}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <GridView
          columnDefs={columns}
          rowData={rows}
          getRowId={(params) => params.data.name}
          emptyDataProps={{ title: t(AnalyticsEvaluatorsI18nKey.NoEvaluators) }}
        />
      </div>
    </div>
  );
};

export default EvaluatorsView;
