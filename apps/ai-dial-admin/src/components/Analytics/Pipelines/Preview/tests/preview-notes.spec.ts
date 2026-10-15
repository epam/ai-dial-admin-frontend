import { describe, expect, test } from 'vitest';

import { noteMock } from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import {
  getNoteTitleKey,
  getSuccessLineKey,
  sortNotes,
} from '@/src/components/Analytics/Pipelines/Preview/utils/preview-notes';
import { NOTE_TITLE_KEYS } from '@/src/components/Analytics/Pipelines/Preview/constants';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { PreviewNoteCode, PreviewNoteSeverity } from '@/src/models/analytics/pipeline-preview';

describe('sortNotes', () => {
  test('puts warnings before informational notes', () => {
    const info = noteMock({ code: PreviewNoteCode.ValuesTruncated, severity: PreviewNoteSeverity.Info });
    const warning = noteMock({ code: PreviewNoteCode.TargetTypeNarrowing, severity: PreviewNoteSeverity.Warning });

    expect(sortNotes([info, warning])).toEqual([warning, info]);
  });

  test('keeps the order received within a severity', () => {
    const first = noteMock({ subject: 'a', severity: PreviewNoteSeverity.Warning });
    const second = noteMock({ subject: 'b', severity: PreviewNoteSeverity.Warning });
    const third = noteMock({ subject: 'c', severity: PreviewNoteSeverity.Warning });

    expect(sortNotes([first, second, third])).toEqual([first, second, third]);
  });

  test('returns an empty list for no notes and does not mutate its input', () => {
    const notes = [
      noteMock({ severity: PreviewNoteSeverity.Info }),
      noteMock({ severity: PreviewNoteSeverity.Warning }),
    ];
    const before = [...notes];

    expect(sortNotes([])).toEqual([]);
    sortNotes(notes);
    expect(notes).toEqual(before);
  });
});

describe('getNoteTitleKey', () => {
  test.each(Object.values(PreviewNoteCode))('has a title for the code %s', (code) => {
    expect(getNoteTitleKey(code)).toBe(NOTE_TITLE_KEYS[code]);
  });

  test('falls back to a generic title for a code the console does not know', () => {
    expect(getNoteTitleKey('added_upstream_later')).toBe(PipelinePreviewI18nKey.NoteTitleUnknown);
  });
});

describe('getSuccessLineKey', () => {
  test('says ready to enable for any disabled pipeline', () => {
    expect(getSuccessLineKey(false, PipelineKind.Aggregate)).toBe(PipelinePreviewI18nKey.SuccessReadyToEnable);
    expect(getSuccessLineKey(false, PipelineKind.Enrich)).toBe(PipelinePreviewI18nKey.SuccessReadyToEnable);
  });

  test('says validation passed for an enabled aggregate, which is re-gated in full', () => {
    expect(getSuccessLineKey(true, PipelineKind.Aggregate)).toBe(PipelinePreviewI18nKey.SuccessValidationPassed);
  });

  test('claims no more than no issues found for an enabled enrichment, which is held to lighter checks', () => {
    expect(getSuccessLineKey(true, PipelineKind.Enrich)).toBe(PipelinePreviewI18nKey.SuccessNoIssues);
  });
});
