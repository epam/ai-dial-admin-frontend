'use client';

import { FC, useCallback } from 'react';

import { TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import BodyTab from './BodyTab';
import ParamsTab from './ParamsTab';

interface Props {
  activeTab: EntityViewTab;
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedTestSuite }) => {
  const t = useI18n();
  const onChangeTemplate = useCallback(
    (template: TestSuite['requestTemplate']) => {
      onChange({ ...selectedTestSuite, requestTemplate: template });
    },
    [onChange, selectedTestSuite],
  );

  return (
    <div className="flex-1 min-h-0">
      {activeTab === EntityViewTab.Parameters && (
        <ParamsTab
          template={selectedTestSuite.requestTemplate || {}}
          changeTemplate={onChangeTemplate}
          field="queryParams"
          title={t(TabsI18nKey.Parameters)}
        />
      )}
      {activeTab === EntityViewTab.Body && (
        <BodyTab template={selectedTestSuite.requestTemplate || {}} changeTemplate={onChangeTemplate} />
      )}
      {activeTab === EntityViewTab.Headers && (
        <ParamsTab
          template={selectedTestSuite.requestTemplate || {}}
          changeTemplate={onChangeTemplate}
          field="headers"
          title={t(TabsI18nKey.Headers)}
        />
      )}
    </div>
  );
};

export default TabsContent;
