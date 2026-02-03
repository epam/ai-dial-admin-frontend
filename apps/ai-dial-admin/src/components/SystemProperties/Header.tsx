'use client';

import { FC } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { EntityViewTab, getSystemPropertiesTabs } from '@/src/utils/tabs/utils';
import ChangedEntityButtons from '../EntityHeaderControls/Buttons/ChangedEntityButtons';

interface Props {
  isChanged: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  activeTab: EntityViewTab;
  onChangeTab: (tab: string) => void;
}

const Header: FC<Props> = ({ isChanged, onSave, onDiscard, activeTab, onChangeTab }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = getSystemPropertiesTabs(t);

  return (
    <div className="flex flex-row justify-between min-h-[34px]">
      <div className="min-w-0 mr-3 flex-1">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeTab} />
      </div>
      {isChanged && <ChangedEntityButtons onDiscard={onDiscard} onSave={onSave} />}
    </div>
  );
};

export default Header;
