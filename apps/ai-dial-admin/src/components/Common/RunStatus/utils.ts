import { RunsI18nKey } from '@/src/constants/i18n';
import { RunStatus } from '@/src/models/evaluation/run';

export const getStatusLabel = (status: RunStatus, t: (key: string) => string) => {
  switch (status) {
    case RunStatus.COMPLETED:
      return t(RunsI18nKey.Completed);
    case RunStatus.RUNNING:
      return t(RunsI18nKey.Running);
    case RunStatus.FAILED:
      return t(RunsI18nKey.Failed);
    case RunStatus.CANCELLED:
      return t(RunsI18nKey.Cancelled);
    default:
      return '';
  }
};
