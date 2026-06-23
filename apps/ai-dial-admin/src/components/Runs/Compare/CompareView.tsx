'use client';

import { IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  DialLoader,
  DialNotification,
  DialPrimaryButton,
  ElementSize,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';

import { getRun, getRuns, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import CompareRunTag from '@/src/components/Runs/Compare/CompareRunTag';
import { CompareRunSlot, compareGridOptions } from '@/src/components/Runs/Compare/constants';
import SelectCompareRunModal from '@/src/components/Runs/Compare/SelectCompareRunModal';
import {
  getCompareColumns,
  getCompareColumnsCompare,
  getSelectableCompareRuns,
} from '@/src/components/Runs/Compare/utils';
import { mergeByTestCaseId, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, Run, RunStatus } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import { FilterOperatorDto } from '@/src/types/request';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  runId: string;
}

const CompareView: FC<Props> = ({ runId }) => {
  const t = useI18n();
  const router = useRouter();

  const [primaryRunId, setPrimaryRunId] = useState(runId);
  const [run, setRun] = useState<Run | null>(null);
  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [suiteRuns, setSuiteRuns] = useState<Run[]>([]);
  const [selectRunSlot, setSelectRunSlot] = useState<CompareRunSlot | null>(null);
  const [comparedRunId, setComparedRunId] = useState<string | null>(null);
  const [comparedResults, setComparedResults] = useState<AnalyticsResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const errorText = t(RunsI18nKey.MetricFailedText);
  const isCompareMode = comparedRunId != null;
  const hasCompareData = comparedResults != null;

  const siblingRuns = useMemo(() => suiteRuns.filter((suiteRun) => suiteRun.id !== run?.id), [suiteRuns, run?.id]);

  const selectRunModalConfig = useMemo(() => {
    if (!selectRunSlot) return null;

    return {
      runs: getSelectableCompareRuns(suiteRuns, selectRunSlot, run?.id, comparedRunId),
      selectedRunId: selectRunSlot === CompareRunSlot.Primary ? run?.id : (comparedRunId ?? undefined),
    };
  }, [selectRunSlot, suiteRuns, run?.id, comparedRunId]);

  const isPrimaryEditDisabled = useMemo(
    () => getSelectableCompareRuns(suiteRuns, CompareRunSlot.Primary, run?.id, comparedRunId).length <= 1,
    [suiteRuns, run?.id, comparedRunId],
  );

  const isSecondaryEditDisabled = useMemo(
    () => getSelectableCompareRuns(suiteRuns, CompareRunSlot.Secondary, run?.id, comparedRunId).length <= 1,
    [suiteRuns, run?.id, comparedRunId],
  );

  useEffect(() => {
    setPrimaryRunId((current) => {
      if (current === runId) return current;
      setComparedRunId(null);
      setComparedResults(null);
      return runId;
    });
  }, [runId]);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setHasLoadError(false);
    setRun(null);
    setResults(null);

    getRun(primaryRunId)
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
        setResults(resultsResponse?.content || []);
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
  }, [primaryRunId]);

  useEffect(() => {
    if (!run?.testSuiteId) return;

    getRuns(
      0,
      100,
      [],
      [
        { column: 'testSuiteId', operator: FilterOperatorDto.EQUALS, value: run.testSuiteId },
        { column: 'status', operator: FilterOperatorDto.EQUALS, value: RunStatus.COMPLETED },
      ],
    ).then((res) => {
      setSuiteRuns((res?.content || []) as Run[]);
    });
  }, [run?.testSuiteId]);

  useEffect(() => {
    if (!comparedRunId) {
      setComparedResults(null);
      return;
    }

    const comparedRun = suiteRuns.find((suiteRun) => suiteRun.id === comparedRunId);
    if (!comparedRun) return;

    setIsCompareLoading(true);
    getTestCaseRunResults(RESULT_FILTERS(comparedRun))
      .then((res) => {
        setComparedResults(res?.content || []);
      })
      .finally(() => {
        setIsCompareLoading(false);
      });
  }, [comparedRunId, suiteRuns]);

  const mergedRowData = useMemo(() => {
    if (!results) return null;
    if (!hasCompareData) return results;
    return mergeByTestCaseId(results, comparedResults);
  }, [results, hasCompareData, comparedResults]);

  const columnDefs = useMemo(() => {
    if (!results) return getCompareColumns([]);
    if (hasCompareData) {
      return getCompareColumnsCompare(mergeByTestCaseId(results, comparedResults), errorText);
    }
    return getCompareColumns(results, errorText);
  }, [results, hasCompareData, comparedResults, errorText]);

  const runTagLabel = useMemo(() => {
    if (!run) return '';
    return t(RunsI18nKey.RunCompareTag, {
      index: 1,
      name: run.testRunName || primaryRunId,
    });
  }, [run, primaryRunId, t]);

  const comparedRunTagLabel = useMemo(() => {
    if (!comparedRunId) return '';
    const comparedRun = suiteRuns.find((suiteRun) => suiteRun.id === comparedRunId);
    if (!comparedRun) return '';
    return t(RunsI18nKey.RunCompareTag, {
      index: 2,
      name: comparedRun.testRunName || comparedRunId,
    });
  }, [comparedRunId, suiteRuns, t]);

  const openSelectRun = (slot: CompareRunSlot) => setSelectRunSlot(slot);
  const closeSelectRun = () => setSelectRunSlot(null);

  const onApplySelectRun = useCallback(
    (selectedRunId: string) => {
      if (!selectRunSlot) return;

      if (selectRunSlot === CompareRunSlot.Primary) {
        if (selectedRunId === comparedRunId) {
          setComparedRunId(null);
          setComparedResults(null);
        }
        setPrimaryRunId(selectedRunId);
        router.replace(getUrnForEntity(ApplicationRoute.RunsCompare, { id: selectedRunId }), { scroll: false });
      } else {
        setComparedRunId(selectedRunId);
      }
      setSelectRunSlot(null);
    },
    [selectRunSlot, comparedRunId, router],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 gap-4">
      <h3 className="dial-h3 text-primary">{t(RunsI18nKey.RunComparison)}</h3>

      <div className="flex items-center gap-2">
        {run && (
          <CompareRunTag
            label={runTagLabel}
            onEdit={() => openSelectRun(CompareRunSlot.Primary)}
            isEditDisabled={isPrimaryEditDisabled}
          />
        )}
        <span className="text-secondary dial-small-text">{t(RunsI18nKey.RunCompareVs)}</span>
        {isCompareMode ? (
          <CompareRunTag
            label={comparedRunTagLabel}
            onEdit={() => openSelectRun(CompareRunSlot.Secondary)}
            isEditDisabled={isSecondaryEditDisabled}
          />
        ) : (
          <DialPrimaryButton
            size={ElementSize.Small}
            label={t(RunsI18nKey.RunCompareAddRun)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            disabled={siblingRuns.length === 0}
            onClick={() => openSelectRun(CompareRunSlot.Secondary)}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        {isLoading || isCompareLoading ? (
          <DialLoader size={40} />
        ) : hasLoadError ? (
          <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>
        ) : (
          <GridView
            key={hasCompareData ? 'compare' : 'normal'}
            columnDefs={columnDefs}
            rowData={mergedRowData}
            additionalGridOptions={compareGridOptions}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
      </div>

      {!isCompareMode && (
        <DialNotification
          variant={NotificationVariant.Info}
          title={t(RunsI18nKey.RunCompareAddSecondRunTitle)}
          message={t(RunsI18nKey.RunCompareAddSecondRunMessage)}
        />
      )}

      {selectRunModalConfig &&
        createPortal(
          <SelectCompareRunModal
            isModalOpen
            runs={selectRunModalConfig.runs}
            selectedRunId={selectRunModalConfig.selectedRunId}
            onClose={closeSelectRun}
            onApply={onApplySelectRun}
          />,
          document.body,
        )}

      <ColorScale />
    </div>
  );
};

export default CompareView;
