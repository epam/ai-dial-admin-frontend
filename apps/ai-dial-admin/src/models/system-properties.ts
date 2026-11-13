export enum WeekDay {
  Mon = 'Mon',
  Tue = 'Tue',
  Wed = 'Wed',
  Thu = 'Thu',
  Fri = 'Fri',
  Sat = 'Sat',
  Sun = 'Sun',
}

/** Deployment-wide anchor for the DAY/WEEK/MONTH rate-limit windows configured per role. */
export interface RateLimitSchedule {
  timezone: string;
  weekStartDay: WeekDay;
  resetTime: string;
}

export enum SpendingLimitMode {
  Off = 'off',
  Shadow = 'shadow',
  Enforce = 'enforce',
}

/** Deployment-wide switch for spending-limit enforcement and the cost object used when a request names none. */
export interface SpendingLimits {
  mode: SpendingLimitMode;
  defaultCostObject: string;
}

export interface GlobalSettings {
  globalInterceptors: string[];
  /** Not editable here yet — kept only so a save round-trips it unchanged instead of dropping it. */
  retriableErrorCodes?: number[];
  /**
   * Absent means Core's defaults (UTC / Mon / 00:00). The Rate Limit Schedule tab displays those
   * defaults but materializes all three values only once a control is edited, so an absent field
   * never makes the page dirty; a save preserves whatever the read returned.
   */
  rateLimitSchedule?: RateLimitSchedule;
  /**
   * Absent means Core's defaults (off / ORG). Same convention as `rateLimitSchedule`: the tab displays
   * the defaults and writes both values only once a control is edited.
   */
  spendingLimits?: SpendingLimits;
}

export interface SystemPropertiesTabStore {
  isChanged: boolean;
  disableSave?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}
