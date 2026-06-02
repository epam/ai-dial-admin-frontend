'use client';

import { FC, RefObject, useMemo } from 'react';

import ValidityStatusLabel from '@/src/components/Common/ValidityStatus/ValidityStatusLabel';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import Metrics from '@/src/components/TestSuites/Metrics/Metrics';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import Runs from '@/src/components/TestSuites/Runs/Runs';
import DatasetBinding from '@/src/components/TestSuites/TestCases/DatasetBinding/DatasetBinding';
import TestCases from '@/src/components/TestSuites/TestCases/TestCases';
import { TestCasesActions } from '@/src/components/TestSuites/TestCases/TestCasesList';
import MethodTabContent from '@/src/components/TestSuites/View/MethodTabContent';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  runRefreshRef: RefObject<(() => void) | null>;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onTestCaseDirtyChange?: (hasDirty: boolean) => void;
  activeTab: EntityViewTab;
  selectedTestSuite: TestSuite;
  originalTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  dataset?: Dataset | null;
  onChangeDataset?: (dataset: Dataset) => void;
  suiteEtag?: string;
}

const TabsContent: FC<Props> = ({
  runRefreshRef,
  testCasesActionsRef,
  onTestCaseDirtyChange,
  originalTestSuite,
  activeTab,
  onChange,
  selectedTestSuite,
  isSkipRefresh,
  dataset,
  onChangeDataset,
  suiteEtag,
}) => {
  const headerPostfix = useMemo(() => {
    return (
      <ValidityStatusLabel
        valid={selectedTestSuite?.valid}
        message={selectedTestSuite.validationWarnings
          ?.map((warning) => `${warning.code}: ${warning.message}`)
          .join(', \n')}
      />
    );
  }, [selectedTestSuite.valid, selectedTestSuite.validationWarnings]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          headerPostfix={headerPostfix}
          entity={selectedTestSuite}
          view={ApplicationRoute.TestSuites}
          id={selectedTestSuite.id}
        >
          <TestSuiteProperties testSuite={selectedTestSuite} onChange={onChange} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.TestSuiteMethod && (
        <MethodTabContent testSuite={selectedTestSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />
      )}
      {activeTab === EntityViewTab.TestCases && !selectedTestSuite.datasetId && (
        <DatasetBinding selectedTestSuite={selectedTestSuite} suiteEtag={suiteEtag ?? ''} />
      )}
      {activeTab === EntityViewTab.TestCases && selectedTestSuite.datasetId && (
        <TestCases
          testCasesActionsRef={testCasesActionsRef}
          onDirtyChange={onTestCaseDirtyChange}
          originalTestSuite={originalTestSuite}
          selectedTestSuite={selectedTestSuite}
          onChange={onChange}
          isSkipRefresh={isSkipRefresh}
          dataset={dataset ?? null}
          suiteEtag={suiteEtag ?? ''}
          onChangeDataset={onChangeDataset}
        />
      )}
      {activeTab === EntityViewTab.Runs && <Runs selectedTestSuite={selectedTestSuite} runRefreshRef={runRefreshRef} />}
      {activeTab === EntityViewTab.Metrics && <Metrics selectedTestSuite={selectedTestSuite} />}
    </>
  );
};

export default TabsContent;
