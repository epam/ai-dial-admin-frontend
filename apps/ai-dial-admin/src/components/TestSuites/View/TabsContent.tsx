'use client';

import { FC, RefObject, useMemo } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ValidityStatusLabel from '@/src/components/Common/ValidityStatus/ValidityStatusLabel';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import Runs from '@/src/components/TestSuites/Runs/Runs';
import TestCases from '@/src/components/TestSuites/TestCases/TestCases';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCasesActions } from '@/src/components/TestSuites/TestCases/TestCasesList';
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
}) => {
  const t = useI18n();

  const headerPrefix = useMemo(() => {
    return <LabelledText copyable={true} label={t(EntityFieldsI18nKey.name)} text={selectedTestSuite.name} />;
  }, [selectedTestSuite.name, t]);

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
          headerPrefix={headerPrefix}
          headerPostfix={headerPostfix}
          entity={selectedTestSuite}
          view={ApplicationRoute.TestSuites}
          id={selectedTestSuite.id}
        >
          <TestSuiteProperties testSuite={selectedTestSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.TestCases && (
        <TestCases
          testCasesActionsRef={testCasesActionsRef}
          onDirtyChange={onTestCaseDirtyChange}
          originalTestSuite={originalTestSuite}
          selectedTestSuite={selectedTestSuite}
          onChange={onChange}
          isSkipRefresh={isSkipRefresh}
        />
      )}
      {activeTab === EntityViewTab.Runs && <Runs selectedTestSuite={selectedTestSuite} runRefreshRef={runRefreshRef} />}
    </>
  );
};

export default TabsContent;
