import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PreviewColumnRole, PreviewNoteCode } from '@/src/models/analytics/pipeline-preview';

import { PreviewSection } from './models';

export const NOTE_TITLE_KEYS: Record<PreviewNoteCode, PipelinePreviewI18nKey> = {
  [PreviewNoteCode.NoMatchingRows]: PipelinePreviewI18nKey.NoteTitleNoMatchingRows,
  [PreviewNoteCode.HeldByEnrichment]: PipelinePreviewI18nKey.NoteTitleHeldByEnrichment,
  [PreviewNoteCode.EnrichmentBehind]: PipelinePreviewI18nKey.NoteTitleEnrichmentBehind,
  [PreviewNoteCode.TargetTypeNarrowing]: PipelinePreviewI18nKey.NoteTitleTargetTypeNarrowing,
  [PreviewNoteCode.ValueOutOfTargetRange]: PipelinePreviewI18nKey.NoteTitleValueOutOfTargetRange,
  [PreviewNoteCode.NoGroupFound]: PipelinePreviewI18nKey.NoteTitleNoGroupFound,
  [PreviewNoteCode.GroupCutByFetchLimit]: PipelinePreviewI18nKey.NoteTitleGroupCutByFetchLimit,
  [PreviewNoteCode.OutputWithoutDescription]: PipelinePreviewI18nKey.NoteTitleOutputWithoutDescription,
  [PreviewNoteCode.UnconstrainedResponse]: PipelinePreviewI18nKey.NoteTitleUnconstrainedResponse,
  [PreviewNoteCode.ValuesTruncated]: PipelinePreviewI18nKey.NoteTitleValuesTruncated,
};

export const ROLE_LABEL_KEYS: Record<PreviewColumnRole, PipelinePreviewI18nKey> = {
  [PreviewColumnRole.Key]: PipelinePreviewI18nKey.RoleKey,
  [PreviewColumnRole.Measure]: PipelinePreviewI18nKey.RoleMeasure,
  [PreviewColumnRole.GrainKey]: PipelinePreviewI18nKey.RoleGrainKey,
  [PreviewColumnRole.Output]: PipelinePreviewI18nKey.RoleOutput,
  [PreviewColumnRole.Input]: PipelinePreviewI18nKey.RoleInput,
};

/** Fixed, so a figure reads the same whatever the viewer's locale. */
export const COUNT_LOCALE = 'en-US';

export const FAILURE_CODES = {
  validation: 'pipeline_validation_failed',
  budget: 'pipeline_preview_budget_exceeded',
  storage: 'clickhouse_unavailable',
  noAccess: ['sensitive_column_not_entitled', 'row_policy_confined', 'pipeline_access_denied', 'forbidden'],
} as const;

export const HTTP_FORBIDDEN = 403;

/** The member of a declaration a validation message names when the problem is in the request template. */
export const REQUEST_TEMPLATE_MEMBER = 'request_template';

/** The grid shows the whole sample up to this height and scrolls past it. */
export const PREVIEW_GRID_MAX_HEIGHT_PX = 480;

/** Tighter than the listing grids: the sample is a handful of rows read once, not a page to scan. */
export const PREVIEW_HEADER_HEIGHT_PX = 60;
export const PREVIEW_ROW_HEIGHT_PX = 40;

/** The longest a group key or a previous key may run before it is cut, with the full key in a tooltip. */
export const PREVIEW_GROUP_KEY_MAX_WIDTH_PX = 420;

export const SECTION_LABEL_KEYS: Record<Exclude<PreviewSection, PreviewSection.Properties>, PipelinePreviewI18nKey> = {
  [PreviewSection.GroupKeys]: PipelinePreviewI18nKey.OpenGroupKeys,
  [PreviewSection.Inputs]: PipelinePreviewI18nKey.OpenInputs,
  [PreviewSection.MemberSelection]: PipelinePreviewI18nKey.OpenMemberSelection,
  [PreviewSection.RequestTemplate]: PipelinePreviewI18nKey.OpenRequestTemplate,
};

/** The element id of each part of the declaration an action may bring into view; `Properties` has none. */
export const PREVIEW_SECTION_ANCHORS: Record<Exclude<PreviewSection, PreviewSection.Properties>, string> = {
  [PreviewSection.GroupKeys]: 'pipeline-section-group-keys',
  [PreviewSection.Inputs]: 'pipeline-section-inputs',
  [PreviewSection.MemberSelection]: 'pipeline-section-member-selection',
  [PreviewSection.RequestTemplate]: 'pipeline-section-request-template',
};

/** The notes whose presentation is the empty state, so a banner for them would say the same thing twice. */
export const EMPTY_STATE_NOTE_CODES: string[] = [PreviewNoteCode.NoMatchingRows, PreviewNoteCode.NoGroupFound];

/** What a count chip reads as when it counts exactly one. */
export const SINGULAR_CHIP_LABEL_KEYS: Partial<Record<PipelinePreviewI18nKey, PipelinePreviewI18nKey>> = {
  [PipelinePreviewI18nKey.ChipLabelGroups]: PipelinePreviewI18nKey.ChipLabelGroupSingular,
  [PipelinePreviewI18nKey.ChipLabelSampleRows]: PipelinePreviewI18nKey.ChipLabelSampleRowSingular,
  [PipelinePreviewI18nKey.ChipLabelOutputs]: PipelinePreviewI18nKey.ChipLabelOutputSingular,
  [PipelinePreviewI18nKey.ChipLabelNotes]: PipelinePreviewI18nKey.ChipLabelNoteSingular,
  [PipelinePreviewI18nKey.ChipLabelMembersShown]: PipelinePreviewI18nKey.ChipLabelMemberShownSingular,
};
