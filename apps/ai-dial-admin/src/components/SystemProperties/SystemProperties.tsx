'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { cloneDeep, isEqual } from 'lodash';

import { updateProperties } from '@/src/app/[lang]/system-properties/actions';
import GlobalInterceptors from '@/src/components/EntityView/Interceptors/GlobalInterceptors';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { GlobalSettings } from '@/src/models/system-properties';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import Header from './Header';

interface Props {
  interceptors: DialInterceptor[];
  globalSettings: GlobalSettings | null;
  /** Whether the server-side read found an existing settings blob — see settings-api.ts. */
  doesSettingsExist: boolean;
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

const SystemProperties: FC<Props> = ({ interceptors, globalSettings, doesSettingsExist, optionWarnings }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing interceptor reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  const [activeTab, setActiveTab] = useState(EntityViewTab.GlobalInterceptors);
  const [currentSettings, setCurrentSettings] = useState(cloneDeep(globalSettings));

  const isChanged = useMemo(() => {
    return !isEqual(currentSettings, globalSettings);
  }, [currentSettings, globalSettings]);

  const changeInterceptors = useCallback((interceptors: string[]) => {
    setCurrentSettings((prev) => ({
      ...prev,
      globalInterceptors: interceptors,
    }));
  }, []);

  const onSave = useCallback(() => {
    // No blob yet -> omit If-Match (create); a blob already exists -> assert existence with '*'.
    // Core never hands back a real etag to compare against — see settings-api.ts.
    const etag = doesSettingsExist ? DEFAULT_ETAG : undefined;

    updateProperties(currentSettings as GlobalSettings, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.SystemProperties, t),
            getUpdateNotificationDescription(ApplicationRoute.SystemProperties, '', t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [currentSettings, doesSettingsExist, router, showNotification, t]);

  const onDiscard = useCallback(() => {
    setCurrentSettings(globalSettings);
  }, [globalSettings]);

  const changeTab = useCallback((tab: string) => {
    setActiveTab(tab as EntityViewTab);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <Header
        isChanged={isChanged}
        onSave={onSave}
        onDiscard={onDiscard}
        activeTab={activeTab}
        onChangeTab={changeTab}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === EntityViewTab.GlobalInterceptors && (
          <GlobalInterceptors
            interceptors={interceptors}
            currentInterceptors={currentSettings?.globalInterceptors || []}
            onChangeInterceptors={changeInterceptors}
          />
        )}
      </div>
    </div>
  );
};

export default SystemProperties;
