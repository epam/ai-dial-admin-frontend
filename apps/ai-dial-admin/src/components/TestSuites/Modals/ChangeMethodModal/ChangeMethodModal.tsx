'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { AlertVariant, DialAlert, DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import Methods from '@/src/components/TestSuites/Methods/Methods';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';

export interface ChangeMethodModalProps {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
  selectedApplication: Deployment | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const ChangeMethodModal: FC<ChangeMethodModalProps> = ({
  testSuite,
  onChangeTestSuite,
  selectedApplication,
  isOpen = false,
  onClose,
}) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const [currentSuite, setCurrentSuite] = useState<TestSuite>(structuredClone(testSuite));

  useEffect(() => {
    if (isOpen) {
      setCurrentSuite(structuredClone(testSuite));
    }
  }, [isOpen, testSuite]);

  const handleConfirm = useCallback(() => {
    onChangeTestSuite(currentSuite);
    onClose?.();
  }, [currentSuite, onChangeTestSuite, onClose]);

  const disableConfirm = useMemo(
    () => !currentSuite.endpointRef?.method || !currentSuite.endpointRef?.relativeUrlPattern || !isValid,
    [currentSuite.endpointRef?.method, currentSuite.endpointRef?.relativeUrlPattern, isValid],
  );

  return (
    <DialConfirmationPopup
      portalId="ChangeMethodModal"
      header={t(TestSuitesI18nKey.ChangeMethod)}
      open={isOpen}
      onClose={onClose}
      confirmLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={handleConfirm}
      disableConfirmButton={disableConfirm}
      size={PopupSize.Lg}
      className="h-[800px]"
    >
      <div className="size-full flex flex-col gap-4 px-6 py-4">
        <Methods selectedTarget={selectedApplication} testSuite={currentSuite} onChange={setCurrentSuite}>
          <DialAlert message={t(TestSuitesI18nKey.MethodChangeWarning)} variant={AlertVariant.Warning} />
        </Methods>
      </div>
    </DialConfirmationPopup>
  );
};

export default ChangeMethodModal;
