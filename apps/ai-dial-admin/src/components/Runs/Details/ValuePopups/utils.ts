import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import {
  getRowDetailRunInfo,
  getRowDetailRunValue,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';

import { FormattedInfoText, ScoreChipClasses, ScoreRunData } from './models';

/** A value is a score only inside the `[0, 1]` range the score buckets cover — the grid cells apply the same bound. */
const parseScore = (raw: string | null): number | null => {
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isNaN(value) || value < 0 || value > 1 ? null : value;
};

export const formatInfoText = (text: string | null): FormattedInfoText | null => {
  if (text == null) return null;

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { text: JSON.stringify(JSON.parse(trimmed), null, 2), language: 'json' };
    } catch {
      // Not JSON after all — shown as the prose it is.
    }
  }

  return { text, language: 'plaintext' };
};

export const getScoreChipClasses = (raw: string | null): ScoreChipClasses | null => {
  const score = parseScore(raw);
  if (score == null) return null;

  const classes = getScoreCellBucketClasses(getScoreCellBucketKey(score, ScoreColorMode.Absolute));
  return classes && { background: classes.background, text: classes.text };
};

export const getScoreRunData = (
  field: RowDetailField,
  run: CompareRun,
  label: string,
  hasComparedMatch: boolean,
): ScoreRunData => {
  const { raw, isFailed } = getRowDetailRunValue(field, run.slot);
  const info = getRowDetailRunInfo(field, run.slot);
  // A failed metric has no reason of its own; its error message is the explanation the reader needs.
  const ownReason = info?.reason ?? null;
  const errorReason = ownReason == null && isFailed ? (info?.error ?? null) : null;

  return {
    run,
    label,
    isMissing: run.slot === CompareRunSlot.Secondary && !hasComparedMatch,
    raw,
    isFailed,
    reason: formatInfoText(ownReason ?? errorReason),
    isReasonError: errorReason != null,
    logs: formatInfoText(info?.logs ?? null),
  };
};
