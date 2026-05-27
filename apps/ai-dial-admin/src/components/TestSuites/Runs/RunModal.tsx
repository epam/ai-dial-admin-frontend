import {
  AlertVariant,
  DialAlert,
  DialFormPopup,
  DialLabelledText,
  DialLoader,
  DialNumberInput,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import { getDatasetTestCases } from '@/src/app/[lang]/datasets/actions';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
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
  const [validRuns, setValidRuns] = useState<number | undefined>();
  const [allRuns, setAllRuns] = useState<number | undefined>();

  useEffect(() => {
    if (validRuns !== undefined) return;
    const datasetId = selectedTestSuite.datasetId;
    if (!datasetId) {
      setAllRuns(0);
      setValidRuns(0);
      return;
    }
    setIsLoading(true);

    const validTestCases = getDatasetTestCases(datasetId, 0, PAGE_SIZE, [], VALID_FILTERS);
    const allTestCases = getDatasetTestCases(datasetId, 0, PAGE_SIZE, [], []);
    Promise.all([validTestCases, allTestCases]).then(([validRes, allRes]) => {
      const validTotal = validRes?.totalElements ?? 0;
      const disabledCount = selectedTestSuite.disabledTestCaseIds?.length ?? 0;
      const selectedTotal = Math.max(0, validTotal - disabledCount);
      setAllRuns(allRes?.totalElements ?? 0);
      setValidRuns(selectedTotal);
      setIsLoading(false);
    });
  }, [selectedTestSuite.datasetId, selectedTestSuite.disabledTestCaseIds, validRuns]);

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
            <DialAlert variant={AlertVariant.Info} message={t(TestSuitesI18nKey.RunWarning)} />
          </>
        )}
      </div>
    </DialFormPopup>
  );
};

export default RunModal;
