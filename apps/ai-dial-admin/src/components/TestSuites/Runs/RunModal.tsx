import {
  Popup,
  LabelledText,
  Spinner,
  Notification,
  NotificationType,
  NotificationVariant,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import NumberStepper from '@/src/components/Common/NumberStepper/NumberStepper';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getDataset, getTestCases } from '@/src/app/[lang]/datasets/actions';
import { getTestSuiteRunConfig } from '@/src/app/[lang]/test-suites/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { RunTestSuiteParams } from '@/src/models/evaluation/run';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { expandTestCasesToRows } from '@/src/utils/evaluation/test-case-grouping';
import { useIncludedIds } from '../TestCases/RunCondition/use-included-ids';
import { MIN_CONCURRENCY, MIN_RUNS, VALID_FILTERS } from './constants';

interface Props {
  isModalOpen: boolean;
  selectedTestSuite: TestSuite;
  onClose: () => void;
  onRun: (params: RunTestSuiteParams) => void | Promise<unknown>;
}

const RunModal: FC<Props> = ({ selectedTestSuite, isModalOpen, onRun, onClose }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState<string | number | undefined>(1);
  const [concurrency, setConcurrency] = useState<string | number | undefined>(1);
  const [maxConcurrencyLevel, setMaxConcurrencyLevel] = useState<number | undefined>();
  const [allRuns, setAllRuns] = useState<number | undefined>();
  const [validRows, setValidRows] = useState<DatasetTestCase[]>([]);
  const [schema, setSchema] = useState<TestCaseSchema[] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (allRuns === undefined) {
      setIsLoading(true);

      const validTestCases = getTestCases(selectedTestSuite.datasetId, 0, 1000, [], VALID_FILTERS);
      const allTestCases = getTestCases(selectedTestSuite.datasetId, 0, 1000, [], []);
      const dataset = selectedTestSuite.datasetId
        ? getDataset(selectedTestSuite.datasetId, DEFAULT_ETAG)
        : Promise.resolve(null);
      const runConfig = getTestSuiteRunConfig().catch(() => null);
      Promise.all([validTestCases, allTestCases, dataset, runConfig]).then(
        ([validRes, allRes, datasetRes, configRes]) => {
          setAllRuns(allRes?.totalElements || 0);
          setValidRows((validRes?.content || []) as DatasetTestCase[]);
          setSchema((datasetRes?.response as Dataset | undefined)?.testCaseSchema);
          const max = (configRes?.response as { maxConcurrencyLevel?: number } | undefined)?.maxConcurrencyLevel;
          setMaxConcurrencyLevel(typeof max === 'number' && max >= MIN_CONCURRENCY ? max : undefined);
          setIsLoading(false);
        },
      );
    }
  }, [selectedTestSuite.datasetId, allRuns]);

  const expandedRows = useMemo(() => expandTestCasesToRows(validRows, schema), [validRows, schema]);
  const includedIds = useIncludedIds(selectedTestSuite.testCaseFilter, expandedRows, schema);
  const validRuns = includedIds ? includedIds.size : validRows.length;

  const totalRuns = allRuns ?? 0;
  const selectedCountText =
    validRuns === totalRuns
      ? t(TestSuitesI18nKey.AllTestCasesCount, { count: totalRuns })
      : t(TestSuitesI18nKey.SelectedTestCasesCount, { selected: validRuns, total: totalRuns });

  const isConcurrencyInvalid =
    !concurrency ||
    +concurrency < MIN_CONCURRENCY ||
    (maxConcurrencyLevel != null && +concurrency > maxConcurrencyLevel);

  const onSubmit = useCallback(() => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    void Promise.resolve(onRun({ numberOfRuns: value, concurrencyLevel: concurrency })).finally(() => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    });
  }, [onRun, value, concurrency]);

  return (
    <Popup
      onClose={onClose}
      header={t(TestSuitesI18nKey.RunTestCases)}
      portalId="Run"
      open={isModalOpen}
      size={PopupSize.Sm}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Run),
        isSubmitDisabled: isLoading || isSubmitting || !value || +value <= 0 || isConcurrencyInvalid || validRuns === 0,
        onCancel: onClose,
        onSubmit: onSubmit,
      })}
    >
      <div className="flex min-h-[300px] flex-col gap-6 p-6">
        {isLoading ? (
          <Spinner size={30} className="m-auto" />
        ) : (
          <>
            <LabelledText label={t(TestSuitesI18nKey.SelectedTestCases)} text={selectedCountText} />
            <NumberStepper
              id="numberOfRuns"
              label={t(TestSuitesI18nKey.NumberOfRuns)}
              value={value}
              onChange={setValue}
              min={MIN_RUNS}
              decreaseAriaLabel={t(TestSuitesI18nKey.DecreaseRuns)}
              increaseAriaLabel={t(TestSuitesI18nKey.IncreaseRuns)}
            />
            <NumberStepper
              id="concurrencyLevel"
              label={t(TestSuitesI18nKey.NumberOfParallelTestCases)}
              value={concurrency}
              onChange={setConcurrency}
              min={MIN_CONCURRENCY}
              max={maxConcurrencyLevel}
              decreaseAriaLabel={t(TestSuitesI18nKey.DecreaseParallelTestCases)}
              increaseAriaLabel={t(TestSuitesI18nKey.IncreaseParallelTestCases)}
            />
            <Notification
              type={NotificationType.SectionMessage}
              variant={NotificationVariant.Info}
              message={t(TestSuitesI18nKey.RunWarning)}
            />
          </>
        )}
      </div>
    </Popup>
  );
};

export default RunModal;
