import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import {
  getRowDetailRunInfo,
  getRowDetailRunValue,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';

import { ErrorI18nKey } from '@/src/constants/i18n';

import { INFO_SECTIONS, METRIC_INFO_SECTION_I18N } from './constants';
import {
  FormattedInfoText,
  MetricDetailField,
  MetricInfoSection,
  ScoreCard,
  ScoreChipClasses,
  ScoreRunData,
} from './models';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

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

/**
 * Splits the details text of a metric into one field per key of its object. Text that is not a JSON object (a
 * plain string, an array) has no keys to split on and yields none, so the caller shows it whole.
 */
export const getDetailFields = (details: string | null): MetricDetailField[] => {
  if (details == null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(details);
  } catch {
    return [];
  }
  if (!isRecord(parsed)) return [];

  return Object.entries(parsed).map(([key, value]) => ({
    key,
    info:
      typeof value === 'string'
        ? { text: value, language: 'plaintext' }
        : { text: JSON.stringify(value, null, 2), language: 'json' },
  }));
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

  const detailFields = getDetailFields(info?.details ?? null);

  return {
    run,
    label,
    isMissing: run.slot === CompareRunSlot.Secondary && !hasComparedMatch,
    raw,
    isFailed,
    reason: formatInfoText(ownReason ?? errorReason),
    isReasonError: errorReason != null,
    detailFields,
    details: detailFields.length > 0 ? null : formatInfoText(info?.details ?? null),
    logs: formatInfoText(info?.logs ?? null),
  };
};

/** The cards a score column shows, top to bottom; a run with nothing under a section gets no card for it. */
export const getScoreCards = (data: ScoreRunData, t: (key: string) => string): ScoreCard[] => {
  const cards: ScoreCard[] = [];

  INFO_SECTIONS.forEach((section) => {
    if (section === MetricInfoSection.Field) {
      data.detailFields.forEach(({ key, info }) => cards.push({ id: `${section}:${key}`, section, title: key, info }));
      return;
    }

    const info = data[section];
    if (!info) return;

    const isErrorCard = section === MetricInfoSection.Reason && data.isReasonError;
    const title = t(isErrorCard ? ErrorI18nKey.Error : METRIC_INFO_SECTION_I18N[section]);
    cards.push({ id: section, section, title, info });
  });

  return cards;
};

/**
 * The card a score popup opens with: the first one, in display order, that any column has content for. That is the
 * reason whenever there is one; a metric without it (Set Comparison) opens on its first details field instead of
 * on a collapsed stack of cards.
 */
export const getDefaultOpenCard = (columns: ScoreRunData[], t: (key: string) => string): string | null => {
  const cards = columns.flatMap((column) => getScoreCards(column, t));

  for (const section of INFO_SECTIONS) {
    const card = cards.find((candidate) => candidate.section === section);
    if (card) return card.id;
  }
  return null;
};
