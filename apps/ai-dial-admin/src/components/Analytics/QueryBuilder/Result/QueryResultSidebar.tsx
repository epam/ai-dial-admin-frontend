'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialCloseButton, DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { executeQuery, executeSqlQuery } from '@/src/app/[lang]/query-builder/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import StatChip from '@/src/components/Analytics/QueryBuilder/Result/StatChip';
import { getResultColumns, getResultTotal } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  request: QueryRunRequest;
}

const QueryResultSidebar: FC<Props> = ({ request }) => {
  const t = useI18n();
  const { sidebar } = useAppContext();
  const { showNotification } = useNotification();

  const [isRunning, setIsRunning] = useState(true);
  const [result, setResult] = useState<StructuredQueryResult | null>(null);

  const queryKey = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let cancelled = false;
    setIsRunning(true);
    (async () => {
      const res =
        request.kind === QueryRequestKind.Sql ? await executeSqlQuery(request.sql) : await executeQuery(request.query);
      if (cancelled) return;
      if (res.success) {
        setResult(res.response ?? null);
      } else {
        showNotification(
          getErrorNotification(res.errorHeader || t(QueryBuilderI18nKey.RunFailed), res.errorMessage, res.requestId),
        );
      }
      setIsRunning(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const columns = useMemo(() => getResultColumns(result), [result]);
  const rows = result?.rows ?? [];
  const total = getResultTotal(result);

  return (
    <div className="flex size-full min-h-0 flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h3>{t(QueryBuilderI18nKey.Result)}</h3>
        <DialCloseButton onClose={() => sidebar.closeSidebar()} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isRunning ? (
          <DialLoader size={40} />
        ) : !result || !rows.length ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.NoRows)} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2">
              <StatChip value={rows.length} label={t(QueryBuilderI18nKey.Rows, { count: rows.length })} />
              {total != null && <StatChip value={total.toLocaleString()} label={t(QueryBuilderI18nKey.Total)} />}
            </div>
            <div className="min-h-0 flex-1">
              <GridView columnDefs={columns as ColDef[]} rowData={rows} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryResultSidebar;
