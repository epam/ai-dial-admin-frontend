import { TRANSITIONAL_RUN_STATUSES } from '@/src/constants/runs';
import { RunsI18nKey } from '@/src/constants/i18n';
import { RunStatus } from '@/src/models/evaluation/run';

/**
 * Falls back to the raw status so a status the backend adds later stays legible instead of rendering
 * as an empty cell.
 */
export const getStatusLabel = (status: RunStatus | string | undefined, t: (key: string) => string) => {
  switch (status) {
    case RunStatus.COMPLETED:
      return t(RunsI18nKey.Completed);
    case RunStatus.RUNNING:
      return t(RunsI18nKey.Running);
    case RunStatus.FAILED:
      return t(RunsI18nKey.Failed);
    case RunStatus.CANCELLING:
      return t(RunsI18nKey.Cancelling);
    case RunStatus.CANCELLED:
      return t(RunsI18nKey.Cancelled);
    default:
      return status ?? '';
  }
};

export const isTransitionalRunStatus = (status?: RunStatus | string): boolean =>
  TRANSITIONAL_RUN_STATUSES.some((transitionalStatus) => transitionalStatus === status);
