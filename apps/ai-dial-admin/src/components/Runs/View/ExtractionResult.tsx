'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useEffect, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRunResults } from '@/src/app/[lang]/runs/actions';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ExtractionResult, Run } from '@/src/models/evaluation/run';
import GridView from '../../Grid/GridView/GridView';
import RunResultDetailPanel from './RunResultDetailPanel';
import { getResultColumns, RESULT_FILTERS } from './utils';

interface Props {
  run: Run;
}

const ExtractionResultTab: FC<Props> = ({ run }) => {
  const t = useI18n();
  const { sidebar } = useAppContext();

  const [results, setResults] = useState<ExtractionResult[] | null>(null);
  const [colDefs, setColDefs] = useState<ColDef[]>(() => getResultColumns([]));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!run?.id) return;

    if (!isLoading && !results) {
      setIsLoading(true);
      getRunResults(RESULT_FILTERS(run)).then((res) => {
        const content = res?.content || [];
        setResults(content);
        setColDefs(getResultColumns(content));
        setIsLoading(false);
      });
    }
  }, [isLoading, results, run]);

  const onRowClicked = useCallback(
    (event: { data?: ExtractionResult }) => {
      const result = event.data;
      if (result) {
        sidebar.showSidebar(<RunResultDetailPanel result={result} onClose={sidebar.closeSidebar} />, 'w-[500px]');
      }
    },
    [sidebar],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <h2>{t(TabsI18nKey.ExtractionResult)}</h2>
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <DialLoader size={40} />
        ) : (
          <GridView
            columnDefs={colDefs}
            rowData={results}
            additionalGridOptions={{
              defaultColDef: { filter: false, floatingFilter: false },
              onRowClicked,
            }}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
      </div>
    </div>
  );
};

export default ExtractionResultTab;
