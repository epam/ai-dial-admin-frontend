import { describe, expect, test } from 'vitest';

import { ModelRunStageState } from '@/src/components/Analytics/Pipelines/Preview/models';
import { columnMock, evaluationMock, llmPreviewMock } from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import {
  findEvaluatedRowIndex,
  formatModelText,
  getCorrectiveRetries,
  getModelColumnNames,
  getStageStates,
} from '@/src/components/Analytics/Pipelines/Preview/utils/model-run';
import { TransformPreset } from '@/src/models/analytics/pipeline';
import { DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';
import { PreviewColumnRole } from '@/src/models/analytics/pipeline-preview';

const { Passed, Failed, NotReached } = ModelRunStageState;

describe('getStageStates', () => {
  test('passes every row-grain stage for an ok evaluation', () => {
    expect(getStageStates({ status: ModelRunStatus.Ok }, false)).toEqual([
      { stage: DlqStage.InputMap, state: Passed },
      { stage: DlqStage.DialCall, state: Passed },
      { stage: DlqStage.Validate, state: Passed },
      { stage: DlqStage.OutputMap, state: Passed },
    ]);
  });

  test('marks stages before the failed one passed and after it not reached', () => {
    expect(
      getStageStates({ status: ModelRunStatus.Failed, stage: DlqStage.Validate }, false).map(({ state }) => state),
    ).toEqual([Passed, Passed, Failed, NotReached]);
  });

  test('starts a group track at group_map', () => {
    expect(getStageStates({ status: ModelRunStatus.Failed, stage: DlqStage.GroupMap }, true)).toEqual([
      { stage: DlqStage.GroupMap, state: Failed },
      { stage: DlqStage.DialCall, state: NotReached },
      { stage: DlqStage.Validate, state: NotReached },
      { stage: DlqStage.OutputMap, state: NotReached },
    ]);
  });

  test('shows an unknown stage as failed ahead of a track not reached', () => {
    const states = getStageStates({ status: ModelRunStatus.Failed, stage: 'render' }, false);

    expect(states[0]).toEqual({ stage: 'render', state: Failed });
    expect(states.slice(1).every(({ state }) => state === NotReached)).toBe(true);
  });
});

describe('findEvaluatedRowIndex', () => {
  const { rows, columns } = llmPreviewMock();

  test('finds the row by the grain key', () => {
    expect(findEvaluatedRowIndex(rows, columns, { grain_key: 'b2' })).toBe(1);
  });

  test('falls back to the first row when no row matches', () => {
    expect(findEvaluatedRowIndex(rows, columns, { grain_key: 'zz' })).toBe(0);
  });

  test('falls back to the first row when the sample has no grain key column', () => {
    expect(findEvaluatedRowIndex(rows, [columnMock({ role: PreviewColumnRole.Input })], { grain_key: 'b2' })).toBe(0);
  });

  test('matches a composite key by value', () => {
    const composite = [{ event_id: { a: 1 } }, { event_id: { a: 2 } }];

    expect(findEvaluatedRowIndex(composite, columns, { grain_key: { a: 2 } })).toBe(1);
  });

  test('finds nothing in an empty sample', () => {
    expect(findEvaluatedRowIndex([], columns, { grain_key: 'a1' })).toBe(-1);
  });
});

describe('getModelColumnNames', () => {
  test('lists the mapped target columns in order', () => {
    expect(getModelColumnNames(evaluationMock())).toEqual(['sentiment', 'topic']);
  });

  test('lists nothing without outputs', () => {
    expect(getModelColumnNames(evaluationMock({ outputs: undefined }))).toEqual([]);
  });
});

describe('formatModelText', () => {
  test('pretty-prints JSON', () => {
    expect(formatModelText('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  test('returns text that does not parse unchanged', () => {
    expect(formatModelText('{"a":1, "b": "cut')).toBe('{"a":1, "b": "cut');
  });
});

describe('getCorrectiveRetries', () => {
  test('counts corrective retries for a chat completion', () => {
    expect(getCorrectiveRetries(2, TransformPreset.ChatCompletion)).toBe(1);
    expect(getCorrectiveRetries(1)).toBe(0);
  });

  test('counts no retries for an application route', () => {
    expect(getCorrectiveRetries(1, TransformPreset.DialAppRoute)).toBe(0);
  });
});
