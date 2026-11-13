'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { cloneDeep, isEqual } from 'lodash';

import { updateProperties } from '@/src/app/[lang]/system-properties/actions';
import GlobalInterceptors from '@/src/components/EntityView/Interceptors/GlobalInterceptors';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import {
  GlobalSettings,
  RateLimitSchedule as RateLimitScheduleModel,
  SpendingLimits as SpendingLimitsModel,
  SystemPropertiesTabStore,
} from '@/src/models/system-properties';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ENTITY_VIEW_CLASS_NAME, ENTITY_VIEW_SCROLL_CLASS_NAME } from '@/src/constants/main-layout';
import { DEFAULT_SPENDING_LIMITS } from './constants';
import Header from './Header';
import { useEnrichmentRoutes } from './hooks/use-enrichment-routes';
import { useSessionsSource } from './hooks/use-sessions-source';
import RateLimitSchedule from './RateLimitSchedule';
import EnrichmentRoutes from './EnrichmentRoutes';
import SessionsSource from './SessionsSource';
import SpendingLimits from './SpendingLimits';
import { isRateLimitScheduleValid } from './utils/rate-limit-schedule';
import { isDefaultCostObjectValid } from './utils/spending-limits';

interface Props {
  interceptors: DialInterceptor[];
  globalSettings: GlobalSettings | null;
  /** Whether the server-side read found an existing settings blob — see settings-api.ts. */
  doesSettingsExist: boolean;
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
  isAnalyticsEnabled?: boolean;
}

const SystemProperties: FC<Props> = ({
  interceptors,
  globalSettings,
  doesSettingsExist,
  optionWarnings,
  isAnalyticsEnabled,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch, resetCounter } = useSaveValidationContext();

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing interceptor reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  const [activeTab, setActiveTab] = useState(EntityViewTab.GlobalInterceptors);
  const [currentSettings, setCurrentSettings] = useState(cloneDeep(globalSettings));
  const isCostObjectInvalid = !isDefaultCostObjectValid(
    (currentSettings?.spendingLimits ?? DEFAULT_SPENDING_LIMITS).defaultCostObject,
  );
  const isScheduleValid = isRateLimitScheduleValid(currentSettings?.rateLimitSchedule);
  const isSessionsSourceTab = activeTab === EntityViewTab.SessionsSource;
  const sessionsSource = useSessionsSource(!!isAnalyticsEnabled && isSessionsSourceTab);
  const isSessionsSourceInvalid = !sessionsSource.isLoading && !sessionsSource.isComplete;
  const isEnrichmentRoutesTab = activeTab === EntityViewTab.EnrichmentRoutes;
  const enrichmentRoutes = useEnrichmentRoutes(!!isAnalyticsEnabled && isEnrichmentRoutesTab);

  // Reset clears registered fields, so re-register even if the value did not change.
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'spendingLimits', isValid: !isCostObjectInvalid });
  }, [dispatch, isCostObjectInvalid, resetCounter]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'rateLimitSchedule', isValid: isScheduleValid });
  }, [dispatch, isScheduleValid, resetCounter]);

  useEffect(() => {
    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: 'spendingLimits' });
      dispatch({ type: ValidationActionType.RemoveField, field: 'rateLimitSchedule' });
    };
  }, [dispatch]);

  const isChanged = useMemo(() => {
    return !isEqual(currentSettings, globalSettings);
  }, [currentSettings, globalSettings]);

  const changeInterceptors = useCallback((interceptors: string[]) => {
    setCurrentSettings((prev) => ({
      ...prev,
      globalInterceptors: interceptors,
    }));
  }, []);

  const changeRateLimitSchedule = useCallback((rateLimitSchedule: RateLimitScheduleModel) => {
    setCurrentSettings((prev) =>
      prev == null ? { globalInterceptors: [], rateLimitSchedule } : { ...prev, rateLimitSchedule },
    );
  }, []);

  const changeSpendingLimits = useCallback((spendingLimits: SpendingLimitsModel) => {
    setCurrentSettings((prev) =>
      prev == null ? { globalInterceptors: [], spendingLimits } : { ...prev, spendingLimits },
    );
  }, []);

  const onSave = useCallback(async () => {
    // No blob yet -> omit If-Match (create); a blob already exists -> assert existence with '*'.
    // Core never hands back a real etag to compare against — see settings-api.ts.
    const etag = doesSettingsExist ? DEFAULT_ETAG : undefined;
    let res: Awaited<ReturnType<typeof updateProperties>>;
    try {
      res = await updateProperties(currentSettings as GlobalSettings, etag);
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
      return;
    }

    if (res.success) {
      dispatch({ type: ValidationActionType.Reset });
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
  }, [currentSettings, dispatch, doesSettingsExist, router, showNotification, t]);

  const onDiscard = useCallback(() => {
    setCurrentSettings(globalSettings);
  }, [globalSettings]);

  const tabStores: Partial<Record<EntityViewTab, SystemPropertiesTabStore>> = {
    [EntityViewTab.SessionsSource]: {
      isChanged: sessionsSource.isChanged,
      disableSave: !sessionsSource.isComplete,
      onSave: sessionsSource.onSave,
      onDiscard: sessionsSource.onDiscard,
    },
    [EntityViewTab.EnrichmentRoutes]: {
      isChanged: enrichmentRoutes.isChanged,
      disableSave: !enrichmentRoutes.isValid,
      onSave: enrichmentRoutes.onSave,
      onDiscard: enrichmentRoutes.onDiscard,
    },
  };
  const activeStore = tabStores[activeTab] ?? { isChanged, onSave, onDiscard };

  const changeTab = useCallback((tab: string) => {
    setActiveTab(tab as EntityViewTab);
  }, []);

  return (
    <div className={ENTITY_VIEW_CLASS_NAME}>
      <Header
        isChanged={activeStore.isChanged}
        isScheduleValid={isScheduleValid}
        isCostObjectInvalid={isCostObjectInvalid}
        isSessionsSourceInvalid={isSessionsSourceInvalid}
        isEnrichmentRoutesInvalid={!enrichmentRoutes.isValid}
        isAnalyticsEnabled={isAnalyticsEnabled}
        disableSave={activeStore.disableSave}
        onSave={activeStore.onSave}
        onDiscard={activeStore.onDiscard}
        activeTab={activeTab}
        onChangeTab={changeTab}
      />

      <div className={ENTITY_VIEW_SCROLL_CLASS_NAME}>
        {activeTab === EntityViewTab.GlobalInterceptors && (
          <GlobalInterceptors
            interceptors={interceptors}
            currentInterceptors={currentSettings?.globalInterceptors || []}
            onChangeInterceptors={changeInterceptors}
          />
        )}
        {activeTab === EntityViewTab.RateLimitSchedule && (
          <RateLimitSchedule
            schedule={currentSettings?.rateLimitSchedule}
            onChangeRateLimitSchedule={changeRateLimitSchedule}
          />
        )}
        {activeTab === EntityViewTab.SpendingLimits && (
          <SpendingLimits
            spendingLimits={currentSettings?.spendingLimits}
            onChangeSpendingLimits={changeSpendingLimits}
          />
        )}
        {isAnalyticsEnabled && isSessionsSourceTab && (
          <SessionsSource
            setting={sessionsSource.setting}
            tables={sessionsSource.tables}
            fields={sessionsSource.fields}
            isLoading={sessionsSource.isLoading}
            isUnsaved={sessionsSource.isUnsaved}
            isUsingDefaults={sessionsSource.isUsingDefaults}
            isDefaultTableMissing={sessionsSource.isDefaultTableMissing}
            onChangeBaseTable={sessionsSource.onChangeBaseTable}
            onChangeRole={sessionsSource.onChangeRole}
          />
        )}
        {isAnalyticsEnabled && isEnrichmentRoutesTab && <EnrichmentRoutes routes={enrichmentRoutes} />}
      </div>
    </div>
  );
};

export default SystemProperties;
