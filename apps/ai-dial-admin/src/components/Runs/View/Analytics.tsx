'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useEffect, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, Run } from '@/src/models/evaluation/run';
import { getAnalyticsColumns, RESULT_FILTERS } from './utils';

interface Props {
  run: Run;
}

const AnalyticsTab: FC<Props> = ({ run }) => {
  const t = useI18n();
  // const { sidebar } = useAppContext();

  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [colDefs, setColDefs] = useState<ColDef[]>(() => getAnalyticsColumns([]));
  // const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!run?.id) return;

    if (!isLoading && !results) {
      setIsLoading(true);
      getTestCaseRunResults(RESULT_FILTERS(run)).then((res) => {
        const content = res?.content || [];
        setResults(content);
        setColDefs(getAnalyticsColumns(content));
        setIsLoading(false);
      });
    }
  }, [isLoading, results, run]);

  // const onRowClicked = useCallback(
  //   (event: RowClickedEvent) => {
  //     if (event.data && selectedResultId !== event.data.id) {
  //       setSelectedResultId(event.data.id);
  //       sidebar.showSidebar(
  //         <RunMetricDetailPanel resultId={event.data.id} onClose={sidebar.closeSidebar} />,
  //         'w-[500px]',
  //       );
  //     } else {
  //       setSelectedResultId(null);
  //       sidebar.closeSidebar();
  //     }
  //   },
  //   [selectedResultId, sidebar],
  // );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <h2>{t(TabsI18nKey.Analytics)}</h2>
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <DialLoader size={40} />
        ) : (
          <GridView
            columnDefs={colDefs}
            rowData={results}
            additionalGridOptions={{
              defaultColDef: { filter: false, floatingFilter: false },
              // onRowClicked,
            }}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;
