'use client';

import { FC, useMemo } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import GridView from '@/src/components/Grid/GridView/GridView';
import StatChip from '@/src/components/Analytics/QueryBuilder/Result/StatChip';
import { getResultColumns, getResultTotal } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';

interface Props {
  result: StructuredQueryResult | null;
  isRunning: boolean;
}

// The main results area: the query result is the page's primary content, the builder lives in the
// right rail. Chart rendering and richer stat tiles arrive with the results-content follow-up.
const ResultArea: FC<Props> = ({ result, isRunning }) => {
  const t = useI18n();

  const columns = useMemo(() => getResultColumns(result), [result]);
  const rows = result?.rows ?? [];
  const total = getResultTotal(result);
  const hasResult = !!result;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
      {hasResult && (
        <div className="flex items-center gap-2">
          <StatChip value={rows.length} label={t(QueryBuilderI18nKey.Rows, { count: rows.length })} />
          {total != null && <StatChip value={total.toLocaleString()} label={t(QueryBuilderI18nKey.Total)} />}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {isRunning ? (
          <DialLoader size={40} />
        ) : !hasResult ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1">
            <DialNoDataContent title={t(QueryBuilderI18nKey.ResultsEmptyTitle)} />
            <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.ResultsEmptyDescription)}</span>
          </div>
        ) : !rows.length ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.NoRows)} />
        ) : (
          <div className="min-h-0 flex-1">
            <GridView columnDefs={columns as ColDef[]} rowData={rows} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultArea;
