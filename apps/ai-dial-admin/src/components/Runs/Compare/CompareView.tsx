'use client';

import { IconPlus } from '@tabler/icons-react';
import { ColDef, ColGroupDef } from 'ag-grid-community';
import { FC, useEffect, useMemo, useState } from 'react';

import {
  DialLoader,
  DialNotification,
  DialPrimaryButton,
  DialTag,
  ElementSize,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import { RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { compareGridOptions } from '@/src/components/Runs/Compare/constants';
import { getCompareColumns } from '@/src/components/Runs/Compare/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, Run } from '@/src/models/evaluation/run';

interface Props {
  runId: string;
}

const CompareView: FC<Props> = ({ runId }) => {
  const t = useI18n();

  const [run, setRun] = useState<Run | null>(null);
  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [colDefs, setColDefs] = useState<(ColDef | ColGroupDef)[]>(() => getCompareColumns([]));
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setHasLoadError(false);
    setRun(null);
    setResults(null);

    getRun(runId)
      .then((runData) => {
        if (isCancelled) return;
        if (!runData) {
          setHasLoadError(true);
          return;
        }
        setRun(runData);
        return getTestCaseRunResults(RESULT_FILTERS(runData));
      })
      .then((resultsResponse) => {
        if (isCancelled || resultsResponse === undefined) return;
        const content = resultsResponse?.content || [];
        setResults(content);
        setColDefs(getCompareColumns(content, t(RunsI18nKey.MetricFailedText)));
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [runId, t]);

  const runTagLabel = useMemo(() => {
    if (!run) return '';
    return t(RunsI18nKey.RunCompareTag, {
      index: 1,
      name: run.testRunName || run.id || runId,
    });
  }, [run, runId, t]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 gap-4">
      <h3 className="dial-h3 text-primary">{t(RunsI18nKey.RunComparison)}</h3>

      <div className="flex items-center gap-2">
        {run && <DialTag label={runTagLabel} className="bg-layer-3 border-0" />}
        <span className="text-secondary dial-small-text">{t(RunsI18nKey.RunCompareVs)}</span>
        <DialPrimaryButton
          size={ElementSize.Small}
          label={t(RunsI18nKey.RunCompareAddRun)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          disabled
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <DialLoader size={40} />
        ) : hasLoadError ? (
          <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>
        ) : (
          <GridView
            columnDefs={colDefs}
            rowData={results}
            additionalGridOptions={compareGridOptions}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
      </div>

      <DialNotification
        variant={NotificationVariant.Info}
        title={t(RunsI18nKey.RunCompareAddSecondRunTitle)}
        message={t(RunsI18nKey.RunCompareAddSecondRunMessage)}
      />

      <ColorScale />
    </div>
  );
};

export default CompareView;
