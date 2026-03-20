'use client';

import { FC, useCallback } from 'react';

import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';

import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  isEditorEnabled?: boolean;
  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const Tabs: FC<Props> = ({ isEditorEnabled = false, tabs, activeTab, onChangeActiveTab }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const onChange = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        onChangeActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab, onChangeActiveTab],
  );

  const showTabs = isReadOnlyAdmin || !isEditorEnabled;

  return (
    showTabs && (
      <div className="flex-1 min-w-0 mr-3">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChange} />
      </div>
    )
  );
};

export default Tabs;
