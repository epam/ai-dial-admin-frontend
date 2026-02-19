'use client';

import { FC, useMemo } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ValidityStatusLabel from '@/src/components/Common/ValidityStatus/ValidityStatusLabel';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import Runs from '@/src/components/TestSuites/Runs/Runs';
import TestCases from '@/src/components/TestSuites/TestCases/TestCases';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedTestSuite }) => {
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
          <TestSuiteProperties testSuite={selectedTestSuite} onChange={onChange} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.TestCases && <TestCases selectedTestSuite={selectedTestSuite} onChange={onChange} />}
      {activeTab === EntityViewTab.Runs && <Runs selectedTestSuite={selectedTestSuite} />}
    </>
  );
};

export default TabsContent;
