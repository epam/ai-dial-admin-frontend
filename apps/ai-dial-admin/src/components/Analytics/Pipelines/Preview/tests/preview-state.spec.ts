import { describe, expect, test } from 'vitest';

import {
  PreviewEmptyKind,
  PreviewFailureKind,
  PreviewSection,
} from '@/src/components/Analytics/Pipelines/Preview/models';
import {
  aggregatePipeline,
  llmGroupPipeline,
  llmPipeline,
  noteMock,
  previewMock,
  sqlPipeline,
} from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import {
  findNote,
  getEmptyKind,
  getFailureKind,
  getFirstVisitKey,
  getRemedySection,
} from '@/src/components/Analytics/Pipelines/Preview/utils/preview-state';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PreviewNoteCode, PreviewNoteSeverity } from '@/src/models/analytics/pipeline-preview';

describe('getFirstVisitKey', () => {
  test.each([
    ['an aggregate', aggregatePipeline(), PipelinePreviewI18nKey.FirstVisitAggregate],
    ['an SQL enrichment', sqlPipeline(), PipelinePreviewI18nKey.FirstVisitSql],
    ['a row-by-row LLM enrichment', llmPipeline(), PipelinePreviewI18nKey.FirstVisitLlmRow],
    ['a group-trigger LLM enrichment', llmGroupPipeline(), PipelinePreviewI18nKey.FirstVisitLlmGroup],
  ])('describes the preview of %s', (_, pipeline, key) => {
    expect(getFirstVisitKey(pipeline)).toBe(key);
  });
});

describe('findNote', () => {
  test('finds a note by its code', () => {
    const note = noteMock({ code: PreviewNoteCode.NoGroupFound });

    expect(findNote([noteMock(), note], PreviewNoteCode.NoGroupFound)).toBe(note);
  });

  test('returns nothing when no note has the code', () => {
    expect(findNote([noteMock()], PreviewNoteCode.NoGroupFound)).toBeUndefined();
  });
});

describe('getEmptyKind', () => {
  const empty = (code: PreviewNoteCode) =>
    previewMock({ rows: [], notes: [noteMock({ code, severity: PreviewNoteSeverity.Warning })] });

  test('returns nothing while the sample has rows', () => {
    expect(getEmptyKind(previewMock(), sqlPipeline())).toBeUndefined();
  });

  test('says no data yet for an empty input when the declaration has no filter', () => {
    expect(getEmptyKind(empty(PreviewNoteCode.NoMatchingRows), sqlPipeline())).toBe(PreviewEmptyKind.NoData);
  });

  test('says no match when the declaration has a filter', () => {
    const pipeline = sqlPipeline({ filter: "event_kind = 'chat'" });

    expect(getEmptyKind(empty(PreviewNoteCode.NoMatchingRows), pipeline)).toBe(PreviewEmptyKind.NoMatch);
  });

  test('reads a blank filter as no filter', () => {
    expect(getEmptyKind(empty(PreviewNoteCode.NoMatchingRows), sqlPipeline({ filter: '   ' }))).toBe(
      PreviewEmptyKind.NoData,
    );
  });

  test('says no group when the service found none', () => {
    expect(getEmptyKind(empty(PreviewNoteCode.NoGroupFound), llmGroupPipeline())).toBe(PreviewEmptyKind.NoGroup);
  });

  test('says held when every matching row is held back by an enrichment', () => {
    expect(getEmptyKind(empty(PreviewNoteCode.HeldByEnrichment), llmPipeline())).toBe(PreviewEmptyKind.Held);
  });

  test('falls back to the filter question when an empty sample carries no note', () => {
    expect(getEmptyKind(previewMock({ rows: [] }), sqlPipeline())).toBe(PreviewEmptyKind.NoData);
  });
});

describe('getFailureKind', () => {
  test.each([
    ['pipeline_validation_failed', PreviewFailureKind.Validation],
    ['pipeline_preview_budget_exceeded', PreviewFailureKind.Budget],
    ['clickhouse_unavailable', PreviewFailureKind.Storage],
    ['sensitive_column_not_entitled', PreviewFailureKind.NoAccess],
    ['row_policy_confined', PreviewFailureKind.NoAccess],
    ['pipeline_access_denied', PreviewFailureKind.NoAccess],
    ['forbidden', PreviewFailureKind.NoAccess],
    ['pipeline_conflict', PreviewFailureKind.Generic],
    ['unknown_pipeline', PreviewFailureKind.Generic],
  ])('classifies the code %s', (code, kind) => {
    expect(getFailureKind({ code })).toBe(kind);
  });

  test('treats any 403 as no access, whatever its code', () => {
    expect(getFailureKind({ code: 'something_new', status: 403 })).toBe(PreviewFailureKind.NoAccess);
  });

  test('treats a failure with no code at all as a generic one', () => {
    expect(getFailureKind({})).toBe(PreviewFailureKind.Generic);
  });
});

describe('getRemedySection', () => {
  test('points a budget refusal of an aggregate at its group keys', () => {
    expect(getRemedySection(PreviewFailureKind.Budget, aggregatePipeline())).toBe(PreviewSection.GroupKeys);
  });

  test('points a budget refusal of a SQL-declared aggregate at its declaration, which has no group keys section', () => {
    expect(
      getRemedySection(PreviewFailureKind.Budget, { ...aggregatePipeline(), sql: 'INSERT INTO t (a) SELECT 1' }),
    ).toBe(PreviewSection.Properties);
  });

  test('points a budget refusal of a row-by-row LLM enrichment at its inputs', () => {
    expect(getRemedySection(PreviewFailureKind.Budget, llmPipeline())).toBe(PreviewSection.Inputs);
  });

  test('points a budget refusal of a group-trigger LLM enrichment at its member selection', () => {
    expect(getRemedySection(PreviewFailureKind.Budget, llmGroupPipeline())).toBe(PreviewSection.MemberSelection);
  });

  test('offers only the declaration for a budget refusal of an SQL enrichment', () => {
    expect(getRemedySection(PreviewFailureKind.Budget, sqlPipeline())).toBe(PreviewSection.Properties);
  });

  test('points a validation failure at the request template when its message names it', () => {
    const message = 'transform.request_template references {{ticket_body}}, which no input binds';

    expect(getRemedySection(PreviewFailureKind.Validation, llmPipeline(), message)).toBe(
      PreviewSection.RequestTemplate,
    );
  });

  test('points any other validation failure at the declaration as a whole', () => {
    expect(getRemedySection(PreviewFailureKind.Validation, llmPipeline(), 'transform.outputs is empty')).toBe(
      PreviewSection.Properties,
    );
    expect(getRemedySection(PreviewFailureKind.Validation, llmPipeline())).toBe(PreviewSection.Properties);
  });

  test('does not point an SQL enrichment at a request template it does not have', () => {
    expect(getRemedySection(PreviewFailureKind.Validation, sqlPipeline(), 'request_template is wrong')).toBe(
      PreviewSection.Properties,
    );
  });
});
