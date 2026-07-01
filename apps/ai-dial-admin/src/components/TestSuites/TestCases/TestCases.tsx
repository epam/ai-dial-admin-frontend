'use client';

import { FC, RefObject, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { NotificationVariant, DialCheckbox, DialNotification } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import TestCasesList, { TestCasesActions } from './TestCasesList';
import TestCasesSchemaModal from './TestCasesSchemaModal';
import TemplateVariables from './TemplateVariables';

interface Props {
  selectedTestSuite: TestSuite;
  originalTestSuite?: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
  dataset: Dataset | null;
  suiteEtag?: string;
  onChangeDataset?: (dataset: Dataset) => void;
}

const TestCases: FC<Props> = ({
  selectedTestSuite,
  originalTestSuite,
  onChange,
  dataset,
  suiteEtag,
  onChangeDataset,
  ...props
}) => {
  const t = useI18n();
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const isNotSaved = useMemo(() => {
    return !isEqual(selectedTestSuite.requestTemplate, originalTestSuite?.requestTemplate);
  }, [selectedTestSuite.requestTemplate, originalTestSuite?.requestTemplate]);

  const isReadOnly = dataset?.visibility === DatasetVisibility.PUBLIC;

  const isDeployment = selectedTestSuite.suiteType === SuiteType.Deployment;
  const isMultiStep = !!selectedTestSuite.multiStep;

  const onToggleMultiStep = (checked: boolean) => {
    onChange({ ...selectedTestSuite, multiStep: checked });
  };

  return (
    <div className="h-full flex flex-col gap-y-6">
      {isDeployment && (
        <div className="flex flex-col gap-1">
          <DialCheckbox
            id="test-suite-multi-step"
            label={t(TestSuitesI18nKey.MultiStep)}
            checked={isMultiStep}
            onChange={(checked) => onToggleMultiStep(!!checked)}
          />
          <span className="text-secondary small">{t(TestSuitesI18nKey.MultiStepDescription)}</span>
        </div>
      )}
      <TemplateVariables selectedTestSuite={selectedTestSuite} schema={dataset?.testCaseSchema} onChange={onChange} />
      <TestCasesList
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
        isReadOnly={isReadOnly}
        dataset={dataset}
        suiteEtag={suiteEtag}
        onOpenSchemaModal={!isReadOnly ? () => setIsSchemaModalOpen(true) : undefined}
        onChangeDataset={onChangeDataset}
        {...props}
      />
      {isNotSaved && <DialNotification variant={NotificationVariant.Info} message={t(TestSuitesI18nKey.Warning)} />}
      {isSchemaModalOpen &&
        createPortal(
          <TestCasesSchemaModal
            isModalOpen={isSchemaModalOpen}
            initialSchema={dataset?.testCaseSchema ?? []}
            onClose={() => setIsSchemaModalOpen(false)}
            onApply={(testCaseSchema) => onChangeDataset?.({ ...dataset, testCaseSchema })}
          />,
          document.body,
        )}
    </div>
  );
};

export default TestCases;
