import {
  AlertVariant,
  DialAlert,
  DialFormPopup,
  DialLabelledText,
  DialNumberInputField,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  isModalOpen: boolean;
  selectedTestSuite: TestSuite;
  onClose: () => void;
  onRun: (value?: number | string) => void;
}

const RunModal: FC<Props> = ({ isModalOpen, onRun, onClose }) => {
  const t = useI18n();
  const [value, setValue] = useState<string | number | undefined>(1);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.RunEvaluation)}
      portalId="Run"
      open={isModalOpen}
      size={PopupSize.Sm}
      submitLabel={t(ButtonsI18nKey.Run)}
      onSubmit={() => onRun(value)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-6 py-6 px-6 h-full">
        <DialLabelledText label={t(TestSuitesI18nKey.SelectedTestCases)} />
        <DialNumberInputField
          elementId="numberOfRuns"
          fieldTitle={t(TestSuitesI18nKey.NumberOfRuns)}
          value={value}
          containerClassName="w-[90px]"
          onChange={setValue}
        />
        <DialAlert variant={AlertVariant.Info} message={t(TestSuitesI18nKey.RunWarning)} />
      </div>
    </DialFormPopup>
  );
};

export default RunModal;
