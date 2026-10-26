'use client';

import { FC, useCallback } from 'react';

import { Tabs, TabItem } from '@epam/ai-dial-ui-kit';

import { TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  tabs: TabItem[];
  activeTab: EntityViewTab;
  isEditorEnabled?: boolean;
  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const HeaderTabs: FC<Props> = ({ isEditorEnabled = false, tabs, activeTab, onChangeActiveTab }) => {
  const t = useI18n();

  const onChange = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        onChangeActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab, onChangeActiveTab],
  );

  const showTabs = !isEditorEnabled;

  return (
    showTabs && (
      <div className="flex-1 min-w-0 mr-3">
        <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={onChange} ariaLabel={t(TabsI18nKey.ListLabel)} />
      </div>
    )
  );
};

export default HeaderTabs;
