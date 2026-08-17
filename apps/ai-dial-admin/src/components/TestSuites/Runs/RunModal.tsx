import {
  DialFormPopup,
  DialLabelledText,
  DialLoader,
  DialNotification,
  DialNumberInput,
  NotificationVariant,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo, useState } from 'react';

import { getDataset, getTestCases } from '@/src/app/[lang]/datasets/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { expandTestCasesToRows } from '@/src/utils/evaluation/test-case-grouping';
import { useIncludedIds } from '../TestCases/RunCondition/use-included-ids';
import { VALID_FILTERS } from './constants';

interface Props {
  isModalOpen: boolean;
  selectedTestSuite: TestSuite;
  onClose: () => void;
  onRun: (value?: number | string) => void;
}

const RunModal: FC<Props> = ({ selectedTestSuite, isModalOpen, onRun, onClose }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState<string | number | undefined>(1);
  const [allRuns, setAllRuns] = useState<number | undefined>();
  const [validRows, setValidRows] = useState<DatasetTestCase[]>([]);
  const [schema, setSchema] = useState<TestCaseSchema[] | undefined>();

  useEffect(() => {
    if (allRuns === undefined) {
      setIsLoading(true);

      const validTestCases = getTestCases(selectedTestSuite.datasetId, 0, 1000, [], VALID_FILTERS);
      const allTestCases = getTestCases(selectedTestSuite.datasetId, 0, 1000, [], []);
      const dataset = selectedTestSuite.datasetId
        ? getDataset(selectedTestSuite.datasetId, DEFAULT_ETAG)
        : Promise.resolve(null);
      Promise.all([validTestCases, allTestCases, dataset]).then(([validRes, allRes, datasetRes]) => {
        setAllRuns(allRes?.totalElements || 0);
        setValidRows((validRes?.content || []) as DatasetTestCase[]);
        setSchema((datasetRes?.response as Dataset | undefined)?.testCaseSchema);
        setIsLoading(false);
      });
    }
  }, [selectedTestSuite.datasetId, allRuns]);

  const expandedRows = useMemo(() => expandTestCasesToRows(validRows, schema), [validRows, schema]);
  const includedIds = useIncludedIds(selectedTestSuite.testCaseFilter, expandedRows, schema);
  const validRuns = includedIds ? includedIds.size : validRows.length;

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.RunEvaluation)}
      portalId="Run"
      open={isModalOpen}
      size={PopupSize.Sm}
      submitLabel={t(ButtonsI18nKey.Run)}
      onSubmit={() => onRun(value)}
      disableSubmitButton={isLoading || !value || +value <= 0 || validRuns === 0}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-6 p-6 h-[300px]">
        {isLoading ? (
          <DialLoader size={30} />
        ) : (
          <>
            <DialLabelledText label={t(TestSuitesI18nKey.SelectedTestCases)} text={`${validRuns} of ${allRuns}`} />
            <DialNumberInput
              id="numberOfRuns"
              labelProps={{ label: t(TestSuitesI18nKey.NumberOfRuns) }}
              value={value}
              containerClassName="w-[90px]"
              onChange={setValue}
            />
            <DialNotification variant={NotificationVariant.Info} message={t(TestSuitesI18nKey.RunWarning)} />
          </>
        )}
      </div>
    </DialFormPopup>
  );
};

export default RunModal;
