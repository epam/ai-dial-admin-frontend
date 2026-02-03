'use client';

import { FC, useCallback } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getViewTabs } from '@/src/utils/tabs/utils';

interface Props {
  view: ApplicationRoute;
  activeTab: EntityViewTab;
  isEditorEnabled: boolean;
  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const HeaderTabs: FC<Props> = ({ isEditorEnabled, view, activeTab, onChangeActiveTab }) => {
  const t = useI18n();

  const tabs = getViewTabs(t, view);

  const onChange = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        onChangeActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab, onChangeActiveTab],
  );

  return (
    !isEditorEnabled && (
      <div className="flex-1 min-w-0 mr-3">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChange} />
      </div>
    )
  );
};

export default HeaderTabs;
