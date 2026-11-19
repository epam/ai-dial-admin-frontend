import { QueriesI18nKey } from '@/src/constants/i18n';
import { SavedQueryScope } from '@/src/models/analytics/saved-query';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';

export const DEFAULT_SAVED_QUERY_SCOPE = SavedQueryScope.Personal;

export const SAVED_QUERY_SCOPE_I18N: Record<SavedQueryScope, QueriesI18nKey> = {
  [SavedQueryScope.Personal]: QueriesI18nKey.ScopePersonal,
  [SavedQueryScope.Common]: QueriesI18nKey.ScopeCommon,
};

export const KNOWN_TIME_PERIODS: string[] = timePeriodOptionsConfig.map((option) => option.value);
