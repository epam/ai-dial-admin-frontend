'use client';

import { FC, useMemo, useState } from 'react';

import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import FieldsTab from './FieldsTab';
import { ComparisonSection } from './models';
import OrderTab from './OrderTab';
import { useFieldSelector } from './useFieldSelector';

interface Props {
  sections: ComparisonSection[];
  fieldSelector: ReturnType<typeof useFieldSelector>;
}

type Tab = 'fields' | 'order';

const FieldSelector: FC<Props> = ({ sections, fieldSelector }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('fields');

  const tabs: TabModel[] = useMemo(
    () => [
      { id: 'fields', label: t(RunsI18nKey.Fields) },
      { id: 'order', label: t(RunsI18nKey.Order) },
    ],
    [t],
  );

  return (
    <div className="w-[250px] border-r border-secondary flex flex-col shrink-0 overflow-hidden">
      <DialTabs tabs={tabs} activeTab={activeTab} onClick={(id) => setActiveTab(id as Tab)} />

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'fields' && <FieldsTab fieldSelector={fieldSelector} />}
        {activeTab === 'order' && <OrderTab sections={sections} fieldSelector={fieldSelector} />}
      </div>
    </div>
  );
};

export default FieldSelector;
