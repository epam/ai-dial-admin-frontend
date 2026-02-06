'use client';

import { FC, useMemo } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TestCases from '../TestCases/TestCases';
import TestSuiteProperties from '../Properties/Properties';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';

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

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          headerPrefix={headerPrefix}
          entity={selectedTestSuite}
          view={ApplicationRoute.TestSuites}
          id={selectedTestSuite.id}
        >
          <TestSuiteProperties testSuite={selectedTestSuite} onChange={onChange} />{' '}
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.TestCases && <TestCases selectedTestSuite={selectedTestSuite} onChange={onChange} />}
      {activeTab === EntityViewTab.Runs && <div>Runs</div>}
      {activeTab === EntityViewTab.Trends && <div>Trends</div>}
    </>
  );
};

export default TabsContent;
