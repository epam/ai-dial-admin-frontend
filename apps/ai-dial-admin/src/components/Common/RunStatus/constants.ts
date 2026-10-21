import { StatusBadgeLeading, StatusBadgeTone } from '@/src/components/Common/StatusBadge/models';
import { RunStatus } from '@/src/models/evaluation/run';
import { RunStatusPresentation } from './models';

export const RUN_STATUS_PRESENTATION: Record<RunStatus, RunStatusPresentation> = {
  [RunStatus.PENDING]: { tone: StatusBadgeTone.Neutral, leading: StatusBadgeLeading.Dot },
  [RunStatus.RUNNING]: { tone: StatusBadgeTone.Info, leading: StatusBadgeLeading.Spinner },
  [RunStatus.CANCELLING]: { tone: StatusBadgeTone.Info, leading: StatusBadgeLeading.Spinner },
  [RunStatus.COMPLETED]: { tone: StatusBadgeTone.Success, leading: StatusBadgeLeading.Dot },
  [RunStatus.CANCELLED]: { tone: StatusBadgeTone.Neutral, leading: StatusBadgeLeading.Dot },
  [RunStatus.FAILED]: { tone: StatusBadgeTone.Error, leading: StatusBadgeLeading.Dot },
};

/** A status the UI has no entry for still renders, as a settled neutral badge showing the raw value. */
export const UNKNOWN_RUN_STATUS_PRESENTATION: RunStatusPresentation = {
  tone: StatusBadgeTone.Neutral,
  leading: StatusBadgeLeading.Dot,
};
