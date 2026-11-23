import { CompareRun } from '@/src/components/Runs/Compare/models';

export enum MetricInfoSection {
  Reason = 'reason',
  /** One key of the metric's details object, shown as a card of its own. */
  Field = 'field',
  /** Details that are not an object of keys, shown as one card. */
  Details = 'details',
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
  detailFields: MetricDetailField[];
  details: FormattedInfoText | null;
  logs: FormattedInfoText | null;
}

export interface MetricDetailField {
  key: string;
  info: FormattedInfoText;
}

export interface ScoreCard {
  id: string;
  section: MetricInfoSection;
  title: string;
  info: FormattedInfoText;
}

export interface FormattedInfoText {
  text: string;
  language: string;
}

export interface ScoreChipClasses {
  background: string;
  text: string;
}
