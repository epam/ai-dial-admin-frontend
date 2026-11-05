export interface FailuresActionTile {
  label: string;
  hint: string;
  retryAllLabel?: string;
  canRetryAll?: boolean;
  isBusy?: boolean;
  onRetryAll?: () => void;
}

export interface FailuresPassiveTile {
  label: string;
  hint: string;
}
