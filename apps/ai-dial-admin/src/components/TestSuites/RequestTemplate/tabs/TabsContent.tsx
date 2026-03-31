'use client';

import { forwardRef, useCallback } from 'react';

import {
  filterParameterBindings,
  getTemplateParameters,
} from '@/src/components/TestSuites/utils/request-template-params';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import BodyTab, { BodyTabRef } from './BodyTab';
import ParamsTab, { ParamsTabRef } from './ParamsTab';

export type TabsContentRef = (ParamsTabRef & BodyTabRef) | null;

interface Props {
  activeTab: EntityViewTab;
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TabsContent = forwardRef<TabsContentRef, Props>(({ activeTab, onChange, selectedTestSuite }, ref) => {
  const t = useI18n();

  const onChangeTemplate = useCallback(
    (template: TestSuite['requestTemplate']) => {
      const paramNames = getTemplateParameters(template);
      const inputBindings = filterParameterBindings(selectedTestSuite.inputBindings, paramNames);

      onChange({
        ...selectedTestSuite,
        requestTemplate: template,
        inputBindings,
      });
    },
    [onChange, selectedTestSuite],
  );

  return (
    <div className="flex-1 min-h-0">
      {activeTab === EntityViewTab.Parameters && (
        <ParamsTab
          ref={ref}
          template={selectedTestSuite.requestTemplate || {}}
          changeTemplate={onChangeTemplate}
          field="queryParams"
          emptyDataTitle={t(BasicI18nKey.NoParameters)}
        />
      )}
      {activeTab === EntityViewTab.Body && (
        <BodyTab
          ref={ref}
          selectedTestSuiteId={selectedTestSuite.id as string}
          template={selectedTestSuite.requestTemplate || {}}
          changeTemplate={onChangeTemplate}
        />
      )}
      {activeTab === EntityViewTab.Headers && (
        <ParamsTab
          ref={ref}
          template={selectedTestSuite.requestTemplate || {}}
          changeTemplate={onChangeTemplate}
          field="headers"
          emptyDataTitle={t(BasicI18nKey.NoHeaders)}
        />
      )}
    </div>
  );
});

TabsContent.displayName = 'TabsContent';

export default TabsContent;
