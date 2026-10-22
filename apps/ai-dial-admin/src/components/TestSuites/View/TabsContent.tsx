'use client';

import { FC, RefObject } from 'react';

import KeepAliveTab from '@/src/components/Common/KeepAliveTab/KeepAliveTab';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import Metrics from '@/src/components/TestSuites/Metrics/Metrics';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import Runs from '@/src/components/TestSuites/Runs/Runs';
import TestCases from '@/src/components/TestSuites/TestCases/TestCases';
import { TestCasesActions } from '@/src/components/TestSuites/TestCases/TestCasesList';
import Trends from '@/src/components/TestSuites/Trends/Trends';
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
  onStartRun?: () => void;
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
  onStartRun,
}) => {
  const isTestCasesActive = activeTab === EntityViewTab.TestCases;

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent entity={selectedTestSuite} view={ApplicationRoute.TestSuites} id={selectedTestSuite.id}>
          <TestSuiteProperties testSuite={selectedTestSuite} onChange={onChange} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.TestSuiteMethod && (
        <MethodTabContent
          testSuite={selectedTestSuite}
          onChange={onChange}
          isSkipRefresh={isSkipRefresh}
          dataset={dataset}
        />
      )}
      <KeepAliveTab isActive={isTestCasesActive}>
        <TestCases
          testCasesActionsRef={testCasesActionsRef}
          onDirtyChange={onTestCaseDirtyChange}
          originalTestSuite={originalTestSuite}
          selectedTestSuite={selectedTestSuite}
          onChange={onChange}
          dataset={dataset ?? null}
          suiteEtag={suiteEtag}
          onChangeDataset={onChangeDataset}
          isActive={isTestCasesActive}
        />
      </KeepAliveTab>
      {activeTab === EntityViewTab.Runs && <Runs selectedTestSuite={selectedTestSuite} runRefreshRef={runRefreshRef} />}
      {activeTab === EntityViewTab.Trends && <Trends selectedTestSuite={selectedTestSuite} onStartRun={onStartRun} />}
      {activeTab === EntityViewTab.Metrics && (
        <Metrics selectedTestSuite={selectedTestSuite} dataset={dataset} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;
