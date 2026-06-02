'use client';

import { FC, RefObject, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { NotificationVariant, DialNotification } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import DatasetHeader from './DatasetHeader/DatasetHeader';
import TestCasesList, { TestCasesActions } from './TestCasesList';
import TestCasesSchemaModal from './TestCasesSchemaModal';
import TemplateVariables from './TemplateVariables';

interface Props {
  selectedTestSuite: TestSuite;
  originalTestSuite?: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
  dataset: Dataset | null;
  suiteEtag: string;
  onChangeDataset?: (dataset: Dataset) => void;
}

const TestCases: FC<Props> = ({
  selectedTestSuite,
  originalTestSuite,
  onChange,
  isSkipRefresh,
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

  const onApplySchema = useCallback(
    (schema: TestCaseSchema[]) => {
      if (dataset) {
        onChangeDataset?.({ ...dataset, testCaseSchema: schema });
      }
    },
    [dataset, onChangeDataset],
  );

  return (
    <div className="h-full flex flex-col gap-y-6">
      <TemplateVariables
        selectedTestSuite={selectedTestSuite}
        schema={dataset?.testCaseSchema}
        onChange={onChange}
        isSkipRefresh={isSkipRefresh}
      />
      {selectedTestSuite.datasetId && dataset && (
        <DatasetHeader
          dataset={dataset}
          selectedTestSuite={selectedTestSuite}
          etag={suiteEtag}
          onChangeDataset={onChangeDataset}
        />
      )}
      <TestCasesList
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
        isReadOnly={isReadOnly}
        schema={dataset?.testCaseSchema}
        onOpenSchemaModal={!isReadOnly ? () => setIsSchemaModalOpen(true) : undefined}
        onSchemaChange={onApplySchema}
        {...props}
      />
      {isNotSaved && <DialNotification variant={NotificationVariant.Info} message={t(TestSuitesI18nKey.Warning)} />}
      {isSchemaModalOpen &&
        createPortal(
          <TestCasesSchemaModal
            isModalOpen={isSchemaModalOpen}
            initialSchema={dataset?.testCaseSchema ?? []}
            onClose={() => setIsSchemaModalOpen(false)}
            onApply={onApplySchema}
          />,
          document.body,
        )}
    </div>
  );
};

export default TestCases;
