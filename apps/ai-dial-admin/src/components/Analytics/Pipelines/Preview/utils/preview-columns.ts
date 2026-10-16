import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PipelinePreview, PreviewColumn, PreviewColumnRole } from '@/src/models/analytics/pipeline-preview';

import { COUNT_LOCALE, EMPTY_STATE_NOTE_CODES, ROLE_LABEL_KEYS, SINGULAR_CHIP_LABEL_KEYS } from '../constants';
import { PreviewChip } from '../models';

export const formatCount = (count: number): string => count.toLocaleString(COUNT_LOCALE);

/** A column the service attaches no role to is shown without a role mark. */
export const getRoleLabelKey = (role?: PreviewColumn['role']): PipelinePreviewI18nKey | undefined =>
  role == null ? undefined : ROLE_LABEL_KEYS[role];

/** The sampled type, then where the value is written when the service names a target type. */
export const getTypeLine = ({ type, target_type }: PreviewColumn): string =>
  target_type == null ? type : `${type} → ${target_type}`;

/** The caption of a chip that counts `count` of something — the whole, when the sample is a part of it. */
const labelKeyFor = (labelKey: PipelinePreviewI18nKey, count: number): PipelinePreviewI18nKey =>
  count === 1 ? (SINGULAR_CHIP_LABEL_KEYS[labelKey] ?? labelKey) : labelKey;

/**
 * The chips of the run bar. An aggregate states its group count, and its total only when the sample is
 * narrower than the whole; a group sample counts members; an SQL enrichment adds its output count; every
 * kind ends with the count of the notes drawn as banners — not the two the empty state presents instead, so the
 * figure is the number of banners the reader can find.
 */
export const getCountChips = ({ rows, columns, notes, total_rows, group_key }: PipelinePreview): PreviewChip[] => {
  const chips: PreviewChip[] = [];

  if (total_rows != null) {
    const isNarrower = total_rows > rows.length;
    chips.push({
      count: rows.length,
      total: isNarrower ? total_rows : undefined,
      labelKey: labelKeyFor(PipelinePreviewI18nKey.ChipLabelGroups, isNarrower ? total_rows : rows.length),
    });
  } else {
    chips.push({
      count: rows.length,
      labelKey: labelKeyFor(
        group_key == null ? PipelinePreviewI18nKey.ChipLabelSampleRows : PipelinePreviewI18nKey.ChipLabelMembersShown,
        rows.length,
      ),
    });
  }

  const outputCount = columns.filter((column) => column.role === PreviewColumnRole.Output).length;
  if (outputCount > 0) {
    chips.push({ count: outputCount, labelKey: labelKeyFor(PipelinePreviewI18nKey.ChipLabelOutputs, outputCount) });
  }

  const noteCount = notes.filter((note) => !EMPTY_STATE_NOTE_CODES.includes(note.code)).length;
  chips.push({ count: noteCount, labelKey: labelKeyFor(PipelinePreviewI18nKey.ChipLabelNotes, noteCount) });

  return chips;
};
