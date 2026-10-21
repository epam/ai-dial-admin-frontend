'use client';

import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider, useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScore from './OverallScore';
import ScoreThreshold from './ScoreThreshold';
import { isOverallScoreDraftValid, normalizeOverallScoreApplyPayload } from './utils';

interface Props {
  isOpen: boolean;
  selectedTestSuite: TestSuite;
  metrics?: Metric[];
  testCaseSchema?: TestCaseSchema[];
  onClose: () => void;
  onApply: (testSuite: TestSuite) => void;
}

const EditOverallScoreModalBody: FC<{
  draft: TestSuite;
  metrics?: Metric[];
  testCaseSchema?: TestCaseSchema[];
  onChange: (testSuite: TestSuite) => void;
  onClose: () => void;
  onApply: (testSuite: TestSuite) => void;
}> = ({ draft, metrics, testCaseSchema, onChange, onClose, onApply }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();

  const canApply = isValid && isOverallScoreDraftValid(draft);

  return (
    <DialConfirmationPopup
      open
      portalId="EditOverallScoreModal"
      header={t(TestSuitesI18nKey.EditOverallScore)}
      confirmLabel={t(ButtonsI18nKey.Apply)}
      size={PopupSize.Lg}
      className="w-[800px] max-w-[calc(100vw-2rem)]"
      disableConfirmButton={!canApply}
      onClose={onClose}
      onConfirm={() => {
        onApply(normalizeOverallScoreApplyPayload(draft));
        onClose();
      }}
    >
      <div className="flex flex-col gap-8 overflow-auto px-6 py-4">
        <OverallScore selectedTestSuite={draft} metrics={metrics} testCaseSchema={testCaseSchema} onChange={onChange} />
        <ScoreThreshold selectedTestSuite={draft} onChange={onChange} />
      </div>
    </DialConfirmationPopup>
  );
};

const EditOverallScoreModal: FC<Props> = ({ isOpen, selectedTestSuite, metrics, testCaseSchema, onClose, onApply }) => {
  const initialDraft = useMemo(() => structuredClone(selectedTestSuite), [selectedTestSuite]);
  const [draft, setDraft] = useState(initialDraft);

  const onChange = useCallback((testSuite: TestSuite) => {
    setDraft(testSuite);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <SaveValidationContextProvider>
      <EditOverallScoreModalBody
        draft={draft}
        metrics={metrics}
        testCaseSchema={testCaseSchema}
        onChange={onChange}
        onClose={onClose}
        onApply={onApply}
      />
    </SaveValidationContextProvider>
  );
};

export default EditOverallScoreModal;
