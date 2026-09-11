export interface GlobalSettings {
  globalInterceptors: string[];
  /** Not editable here yet — kept only so a save round-trips it unchanged instead of dropping it. */
  retriableErrorCodes?: number[];
}
