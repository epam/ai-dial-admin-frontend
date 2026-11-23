'use client';

import { FC } from 'react';

import { Button, ButtonVariant, Tabs, TabStatus } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityViewTab, getSystemPropertiesTabs, getTabStatusProps } from '@/src/utils/tabs/utils';
import ChangedEntityButtons from '../EntityHeaderControls/Buttons/ChangedEntityButtons';

interface Props {
  isChanged: boolean;
  isDiscardable?: boolean;
  isScheduleValid: boolean;
  isCostObjectInvalid: boolean;
  isSessionsSourceInvalid?: boolean;
  isEnrichmentRoutesInvalid?: boolean;
  isAnalyticsEnabled?: boolean;
  disableSave?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  activeTab: EntityViewTab;
  onChangeTab: (tab: string) => void;
}

const Header: FC<Props> = ({
  isChanged,
  isDiscardable = true,
  isScheduleValid,
  isCostObjectInvalid,
  isSessionsSourceInvalid,
  isEnrichmentRoutesInvalid,
  isAnalyticsEnabled,
  disableSave,
  onSave,
  onDiscard,
  activeTab,
  onChangeTab,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = getSystemPropertiesTabs(t, isAnalyticsEnabled).map((tab) => {
    const isInvalid =
      (tab.id === EntityViewTab.RateLimitSchedule && !isScheduleValid) ||
      (tab.id === EntityViewTab.SpendingLimits && isCostObjectInvalid) ||
      (tab.id === EntityViewTab.SessionsSource && isSessionsSourceInvalid) ||
      (tab.id === EntityViewTab.EnrichmentRoutes && isEnrichmentRoutesInvalid);
    const statusProps = getTabStatusProps(t, isInvalid ? TabStatus.Error : undefined);
    // Tabs appends the status label directly to the tab name for assistive technology.
    return {
      ...tab,
      ...statusProps,
      statusLabel: statusProps.statusLabel ? `: ${statusProps.statusLabel}` : undefined,
    };
  });

  return (
    <div className="flex flex-row justify-between min-h-[34px]">
      <div className="min-w-0 mr-3 flex-1">
        <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={onChangeTab} ariaLabel={t(TabsI18nKey.ListLabel)} />
      </div>
      {isChanged &&
        (isDiscardable ? (
          <ChangedEntityButtons disableSave={disableSave} onDiscard={onDiscard} onSave={onSave} />
        ) : (
          <div className="p-3 lg:p-0">
            <Button
              variant={ButtonVariant.Primary}
              label={t(ButtonsI18nKey.Save)}
              onClick={onSave}
              disabled={disableSave}
            />
          </div>
        ))}
    </div>
  );
};

export default Header;
