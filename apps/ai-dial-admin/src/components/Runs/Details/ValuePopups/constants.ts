import { DIFF_DELETE_HIGHLIGHT_CLASS, DIFF_INSERT_HIGHLIGHT_CLASS } from '@/src/components/Common/DiffLegend/constants';
import { CompareRunSlot, RUN_COMPARE_PRIMARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { TextDiffKind } from '@/src/models/text-diff';

import { MetricInfoSection } from './models';

export const METRIC_INFO_SECTION_I18N: Record<MetricInfoSection, RunsI18nKey> = {
  [MetricInfoSection.Reason]: RunsI18nKey.MetricReason,
  [MetricInfoSection.Logs]: RunsI18nKey.MetricLogs,
};

// A score is a chip on its bucket colour; an error or a missing value is plain text on the Score card, as
// designed (frames `Score_Error`, `Score_0`, `Score_1`).
export const SCORE_CHIP_BUCKET_CLASSES = 'px-3 py-2 rounded';
export const ERROR_SCORE_CHIP_CLASSES = 'py-2 text-error';
export const NEUTRAL_SCORE_CHIP_CLASSES = 'py-2 text-primary';

// The compare grid's diff palette: added and removed take the legend's insert/delete borders, a change the
// accent-primary border the grid gives a changed cell.
export const DIFF_HIGHLIGHT_CLASS_BY_KIND: Record<TextDiffKind, string> = {
  [TextDiffKind.Added]: `${DIFF_INSERT_HIGHLIGHT_CLASS} bg-accent-secondary-alpha`,
  [TextDiffKind.Removed]: `${DIFF_DELETE_HIGHLIGHT_CLASS} bg-error`,
  [TextDiffKind.Changed]: 'rounded-sm border border-accent-primary bg-accent-primary-alpha',
};

/** The one column a single run's metric popup shows: the run is its own baseline, and its name is the popup title. */
export const SINGLE_RUN_COLUMNS: CompareRun[] = [
  { slot: CompareRunSlot.Primary, index: RUN_COMPARE_PRIMARY_INDEX, id: '', name: '', isBaseline: true },
];
