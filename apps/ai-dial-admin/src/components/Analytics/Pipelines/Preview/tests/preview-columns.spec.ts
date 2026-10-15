import { describe, expect, test } from 'vitest';

import { columnMock, noteMock, previewMock } from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import {
  formatCount,
  getCountChips,
  getRoleLabelKey,
  getTypeLine,
} from '@/src/components/Analytics/Pipelines/Preview/utils/preview-columns';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PreviewColumnRole, PreviewNoteCode } from '@/src/models/analytics/pipeline-preview';

describe('getRoleLabelKey', () => {
  test.each([
    [PreviewColumnRole.Key, PipelinePreviewI18nKey.RoleKey],
    [PreviewColumnRole.Measure, PipelinePreviewI18nKey.RoleMeasure],
    [PreviewColumnRole.GrainKey, PipelinePreviewI18nKey.RoleGrainKey],
    [PreviewColumnRole.Output, PipelinePreviewI18nKey.RoleOutput],
    [PreviewColumnRole.Input, PipelinePreviewI18nKey.RoleInput],
  ])('names the role %s', (role, key) => {
    expect(getRoleLabelKey(role)).toBe(key);
  });

  test('returns nothing for a column the service attaches no role to', () => {
    expect(getRoleLabelKey(undefined)).toBeUndefined();
  });
});

describe('getTypeLine', () => {
  test('states the sampled type and the type it is written as', () => {
    expect(getTypeLine(columnMock({ type: 'long', target_type: 'integer' }))).toBe('long → integer');
  });

  test('states the sampled type alone when there is no target type', () => {
    expect(getTypeLine(columnMock({ type: 'uuid', target_type: undefined }))).toBe('uuid');
  });
});

describe('formatCount', () => {
  test('groups thousands the same way whatever the locale', () => {
    expect(formatCount(1284)).toBe('1,284');
    expect(formatCount(0)).toBe('0');
  });
});

describe('getCountChips', () => {
  const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ event_id: String(index) }));

  test('counts sample rows and notes for an SQL enrichment, with the output count', () => {
    const chips = getCountChips(previewMock({ rows: rows(5) }));

    expect(chips).toEqual([
      { count: 5, labelKey: PipelinePreviewI18nKey.ChipLabelSampleRows },
      { count: 1, labelKey: PipelinePreviewI18nKey.ChipLabelOutputSingular },
      { count: 0, labelKey: PipelinePreviewI18nKey.ChipLabelNotes },
    ]);
  });

  test('states the total of an aggregate only when the sample is narrower than the whole', () => {
    const chips = getCountChips(previewMock({ rows: rows(5), total_rows: 1284, columns: [columnMock()] }));

    expect(chips[0]).toEqual({ count: 5, total: 1284, labelKey: PipelinePreviewI18nKey.ChipLabelGroups });
  });

  test('states no total for an aggregate whose sample holds every group', () => {
    const chips = getCountChips(previewMock({ rows: rows(3), total_rows: 3, columns: [columnMock()] }));

    expect(chips[0]).toEqual({ count: 3, total: undefined, labelKey: PipelinePreviewI18nKey.ChipLabelGroups });
  });

  test('counts members rather than rows for a group sample', () => {
    const chips = getCountChips(previewMock({ rows: rows(4), group_key: 'chat-42', columns: [columnMock()] }));

    expect(chips[0]).toEqual({ count: 4, labelKey: PipelinePreviewI18nKey.ChipLabelMembersShown });
  });

  test('adds no output chip when no column is an output', () => {
    const chips = getCountChips(previewMock({ columns: [columnMock({ role: PreviewColumnRole.Input })] }));

    expect(chips.map((chip) => chip.labelKey)).toEqual([
      PipelinePreviewI18nKey.ChipLabelSampleRows,
      PipelinePreviewI18nKey.ChipLabelNotes,
    ]);
  });

  test('reads a count of exactly one in the singular', () => {
    const chips = getCountChips(previewMock({ rows: rows(1), notes: [noteMock()] }));

    expect(chips.map((chip) => chip.labelKey)).toEqual([
      PipelinePreviewI18nKey.ChipLabelSampleRowSingular,
      PipelinePreviewI18nKey.ChipLabelOutputSingular,
      PipelinePreviewI18nKey.ChipLabelNoteSingular,
    ]);
  });

  test('reads one group of one in the singular and one of many in the plural', () => {
    const columns = [columnMock()];

    expect(getCountChips(previewMock({ rows: rows(1), total_rows: 1, columns }))[0].labelKey).toBe(
      PipelinePreviewI18nKey.ChipLabelGroupSingular,
    );
    expect(getCountChips(previewMock({ rows: rows(1), total_rows: 40, columns }))[0].labelKey).toBe(
      PipelinePreviewI18nKey.ChipLabelGroups,
    );
  });

  test('reads one member in the singular', () => {
    const chips = getCountChips(previewMock({ rows: rows(1), group_key: 'chat-42', columns: [columnMock()] }));

    expect(chips[0].labelKey).toBe(PipelinePreviewI18nKey.ChipLabelMemberShownSingular);
  });

  // The two codes the empty state presents have no banner, so counting them gave a figure no banner accounts for.
  test('counts only the notes drawn as banners, not the two the empty state presents', () => {
    const notes = [
      noteMock({ code: PreviewNoteCode.NoMatchingRows }),
      noteMock({ code: PreviewNoteCode.NoGroupFound }),
      noteMock({ code: PreviewNoteCode.TargetTypeNarrowing }),
      noteMock({ code: PreviewNoteCode.ValuesTruncated }),
    ];

    const chips = getCountChips(previewMock({ notes }));

    expect(chips.at(-1)).toEqual({ count: 2, labelKey: PipelinePreviewI18nKey.ChipLabelNotes });
  });

  test('counts no notes when the only note is one the empty state presents', () => {
    const chips = getCountChips(previewMock({ rows: [], notes: [noteMock({ code: PreviewNoteCode.NoMatchingRows })] }));

    expect(chips.at(-1)).toEqual({ count: 0, labelKey: PipelinePreviewI18nKey.ChipLabelNotes });
  });

  test('counts an empty sample as zero rather than dropping the chip', () => {
    const chips = getCountChips(previewMock({ rows: [] }));

    expect(chips[0]).toEqual({ count: 0, labelKey: PipelinePreviewI18nKey.ChipLabelSampleRows });
  });
});
