import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { PreviewNote, PreviewNoteSeverity } from '@/src/models/analytics/pipeline-preview';

import { NOTE_TITLE_KEYS } from '../constants';

const isKnownCode = (code: string): code is keyof typeof NOTE_TITLE_KEYS => code in NOTE_TITLE_KEYS;

/** Warnings before informational notes, otherwise in the order received. */
export const sortNotes = (notes: PreviewNote[]): PreviewNote[] => [
  ...notes.filter((note) => note.severity === PreviewNoteSeverity.Warning),
  ...notes.filter((note) => note.severity !== PreviewNoteSeverity.Warning),
];

/** A code added upstream still gets a title, so its message is shown rather than dropped. */
export const getNoteTitleKey = (code: string): PipelinePreviewI18nKey =>
  isKnownCode(code) ? NOTE_TITLE_KEYS[code] : PipelinePreviewI18nKey.NoteTitleUnknown;

/**
 * What a preview with no notes claims. A disabled pipeline went through the full arming checks; an enabled
 * aggregate is re-gated in full; an enabled enrichment is held to lighter checks, so its line claims no more.
 */
export const getSuccessLineKey = (isEnabled: boolean, kind: PipelineKind): PipelinePreviewI18nKey => {
  if (!isEnabled) return PipelinePreviewI18nKey.SuccessReadyToEnable;

  return kind === PipelineKind.Aggregate
    ? PipelinePreviewI18nKey.SuccessValidationPassed
    : PipelinePreviewI18nKey.SuccessNoIssues;
};
