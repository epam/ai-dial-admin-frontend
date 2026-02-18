import {
  AlertVariant,
  DialAlert,
  DialFormPopup,
  DialLabelledText,
  DialLoader,
  DialNumberInputField,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import { getTestCases } from '@/src/app/[lang]/test-suites/actions';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { FilterOperatorDto } from '@/src/types/request';

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

  useEffect(() => {
    if (!validRuns) {
      setIsLoading(true);
      getTestCases(
        selectedTestSuite.id,
        0,
        PAGE_SIZE,
        [],
        [
          { column: 'valid', operator: FilterOperatorDto.EQUALS, value: 'true' },
          { column: 'enabled', operator: FilterOperatorDto.EQUALS, value: 'true' },
        ],
      ).then((res) => {
        setValidRuns(res?.totalElements || 0);
        setIsLoading(false);
      });
    }
  }, [selectedTestSuite.id, validRuns]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.RunEvaluation)}
      portalId="Run"
      open={isModalOpen}
      size={PopupSize.Sm}
      submitLabel={t(ButtonsI18nKey.Run)}
      onSubmit={() => onRun(value)}
      disableSubmitButton={isLoading || !validRuns || +validRuns === 0}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-6 py-6 px-6 h-[300px]">
        {isLoading ? (
          <DialLoader size={30} />
        ) : (
          <>
            <DialLabelledText label={t(TestSuitesI18nKey.SelectedTestCases)} text={validRuns} />
            <DialNumberInputField
              elementId="numberOfRuns"
              fieldTitle={t(TestSuitesI18nKey.NumberOfRuns)}
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
