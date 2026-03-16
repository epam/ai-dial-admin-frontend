'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AlertVariant, DialAlert, DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import Methods from '@/src/components/TestSuites/Methods/Methods';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';

export interface ChangeMethodModalProps {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
  selectedApplication: Deployment | null;
  isModal: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const ChangeMethodModal: FC<ChangeMethodModalProps> = ({
  testSuite,
  onChangeTestSuite,
  selectedApplication,
  isModal,
  isOpen = false,
  onClose,
}) => {
  const t = useI18n();
  const [currentSuite, setCurrentSuite] = useState<TestSuite>(structuredClone(testSuite));

  useEffect(() => {
    if (isModal && isOpen) {
      setCurrentSuite(structuredClone(testSuite));
    }
  }, [isModal, isOpen, testSuite]);

  const handleConfirm = useCallback(() => {
    onChangeTestSuite(currentSuite);
    onClose?.();
  }, [currentSuite, onChangeTestSuite, onClose]);

  const disableConfirm = useMemo(
    () => !currentSuite.endpointRef?.method || !currentSuite.endpointRef?.relativeUrlPattern,
    [currentSuite.endpointRef?.method, currentSuite.endpointRef?.relativeUrlPattern],
  );

  const inlineOnChange = useCallback<Dispatch<SetStateAction<TestSuite>>>(
    (value) => {
      const next = typeof value === 'function' ? value(testSuite) : value;
      onChangeTestSuite(next);
    },
    [onChangeTestSuite, testSuite],
  );

  const content = (
    <div className="size-full flex flex-col gap-4">
      <div className="flex-1 min-h-0 overflow-auto">
        <Methods
          selectedApplication={selectedApplication}
          testSuite={isModal ? currentSuite : testSuite}
          onChange={isModal ? setCurrentSuite : inlineOnChange}
          isCreate={!isModal}
        />
      </div>
      {isModal && <DialAlert message={t(TestSuitesI18nKey.MethodChangeWarning)} variant={AlertVariant.Warning} />}
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    isOpen &&
    onClose &&
    createPortal(
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
        <div className="size-full flex flex-col gap-4 px-6 py-4">{content}</div>
      </DialConfirmationPopup>,
      document.body,
    )
  );
};

export default ChangeMethodModal;
