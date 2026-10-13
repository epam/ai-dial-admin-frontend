'use client';

import { FC, RefObject } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import DatasetProperties from '@/src/components/Datasets/Properties/Properties';
import DatasetSchemaTab from '@/src/components/Datasets/Schema/SchemaTab';
import DatasetTestCases from '@/src/components/Datasets/TestCases/TestCases';
import { DatasetTestCasesActions } from '@/src/components/Datasets/TestCases/TestCasesList';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  testCasesActionsRef: RefObject<DatasetTestCasesActions | null>;
  onTestCaseDirtyChange: (hasDirty: boolean) => void;
  activeTab: EntityViewTab;
  selectedDataset: Dataset;
  savedSchema?: TestCaseSchema[];
  isSkipRefresh?: boolean;
  onChange: (dataset: Dataset, isSkipRefresh?: boolean) => void;
  nameExistsError?: string;
}

const DatasetTabsContent: FC<Props> = ({
  testCasesActionsRef,
  onTestCaseDirtyChange,
  activeTab,
  selectedDataset,
  savedSchema,
  isSkipRefresh,
  onChange,
  nameExistsError,
}) => {
  const t = useI18n();
  const updatedAt = useLocalDateTimeString(selectedDataset.updatedAt);
  const createdAt = useLocalDateTimeString(selectedDataset.createdAt);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
            {!!selectedDataset.updatedAt && <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={updatedAt} />}
            {!!selectedDataset.createdAt && <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={createdAt} />}
          </div>
          <div className="pt-8">
            <DatasetProperties
              dataset={selectedDataset}
              onChange={onChange}
              isModal={false}
              nameExistsError={nameExistsError}
            />
          </div>
        </div>
      )}
      {activeTab === EntityViewTab.Schema && (
        <DatasetSchemaTab dataset={selectedDataset} isSkipRefresh={isSkipRefresh} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.TestCases && (
        <DatasetTestCases
          dataset={selectedDataset}
          savedSchema={savedSchema}
          testCasesActionsRef={testCasesActionsRef}
          onDirtyChange={onTestCaseDirtyChange}
        />
      )}
    </>
  );
};

export default DatasetTabsContent;
