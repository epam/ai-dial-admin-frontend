import {
  SINCE_CREATION_PERIOD_ID,
  TimeFilterOption,
  timePeriodOptionsConfig,
} from '@/src/constants/global-time-filter';
import { toDateOrNull } from '@/src/utils/formatting/date';

/**
 * Builds the option list for a surface that may offer a "Since Creation" period anchored to one
 * entity's creation timestamp. Returns the shared preset list unchanged when the timestamp is
 * missing or unparseable, so the option's absence is a consequence of this one branch rather than
 * a separate disabled-row concept.
 */
export const getTimeFilterOptions = (createdAt: string | undefined, sinceCreationLabel: string): TimeFilterOption[] => {
  const startDate = toDateOrNull(createdAt);

  if (startDate == null) {
    return timePeriodOptionsConfig;
  }

  return [...timePeriodOptionsConfig, { value: SINCE_CREATION_PERIOD_ID, label: sinceCreationLabel, startDate }];
};
