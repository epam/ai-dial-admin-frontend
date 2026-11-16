import { SavedQueryScope } from '@/src/models/analytics/saved-query';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';

export const DEFAULT_SAVED_QUERY_SCOPE = SavedQueryScope.Personal;

export const KNOWN_TIME_PERIODS: string[] = timePeriodOptionsConfig.map((option) => option.value);
