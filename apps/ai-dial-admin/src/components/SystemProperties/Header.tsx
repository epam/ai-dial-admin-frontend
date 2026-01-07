'use client';

import { FC, useEffect, useState } from 'react';

import { DialNeutralButton, DialPrimaryButton, DialTabs } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { EntityViewTab, getSystemPropertiesTabs } from '@/src/utils/tabs/utils';

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

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassNames, setButtonsClassNames] = useState('');

  useEffect(() => {
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
  }, [isTablet, isMobile]);

  return (
    <div className="flex flex-row justify-between min-h-[34px]">
      <div className="min-w-0 mr-3">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeTab} />
      </div>
      {isChanged && (
        <div className="flex flex-row gap-3 p-3 lg:p-0">
          <DialNeutralButton className={buttonsClassNames} label={t(ButtonsI18nKey.Discard)} onClick={onDiscard} />
          <DialPrimaryButton className={buttonsClassNames} label={t(ButtonsI18nKey.Save)} onClick={onSave} />
        </div>
      )}
    </div>
  );
};

export default Header;
