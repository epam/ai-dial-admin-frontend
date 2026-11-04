import { CompareRun } from '@/src/components/Runs/Compare/models';

export enum MetricInfoSection {
  Reason = 'reason',
  Logs = 'logs',
}

export interface ScoreRunData {
  run: CompareRun;
  label: string;
  isMissing: boolean;
  raw: string | null;
  isFailed: boolean;
  reason: FormattedInfoText | null;
  /** The reason text is the metric's error message, because the failed metric has no reason of its own. */
  isReasonError: boolean;
  logs: FormattedInfoText | null;
}

export interface FormattedInfoText {
  text: string;
  language: string;
}

export interface ScoreChipClasses {
  background: string;
  text: string;
}
