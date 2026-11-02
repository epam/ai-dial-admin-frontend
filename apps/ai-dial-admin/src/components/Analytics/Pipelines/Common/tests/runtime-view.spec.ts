import { describe, expect, test } from 'vitest';

import {
  isGenerationBehind,
  pauseOf,
  runtimeStatusOfView,
} from '@/src/components/Analytics/Pipelines/Common/runtime-view';
import { runtimeRead, runtimeView } from '@/src/components/Analytics/Pipelines/Common/tests/mock';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import {
  PauseOrigin,
  PipelineRuntimeState,
  PipelineRuntimeStatus,
  RuntimeReadOutcome,
} from '@/src/models/analytics/pipeline-runtime';

const PAUSE = {
  state: PipelineRuntimeState.Paused,
  origin: PauseOrigin.Breaker,
  reason: '7 of its last 50 group(s) dead-lettered',
  since: '2026-10-05T09:00:00Z',
  resumes_at: '2026-10-05T10:00:00Z',
};

const readingState = (state: PipelineRuntimeState) => runtimeRead({ view: runtimeView({ status: { state } }) });

const readingOutcome = (outcome: RuntimeReadOutcome) => runtimeRead({ outcome });

describe('pauseOf', () => {
  test('reads the pause the runner is enforcing', () => {
    expect(pauseOf(PAUSE)).toEqual({
      origin: PauseOrigin.Breaker,
      reason: PAUSE.reason,
      since: PAUSE.since,
      resumes_at: PAUSE.resumes_at,
    });
  });

  test('reads no pause from a state that is not paused', () => {
    expect(pauseOf({ state: PipelineRuntimeState.Active })).toBeUndefined();
    expect(pauseOf(undefined)).toBeUndefined();
  });

  // The runner holds the origin and the start time in memory, so a restart can lose them while the
  // pause survives. Requiring them meant a chip reading Paused above a page with no Resume on it.
  test('reads a pause the runner can no longer describe', () => {
    expect(pauseOf({ state: PipelineRuntimeState.Paused })).toEqual({
      origin: undefined,
      reason: undefined,
      since: undefined,
      resumes_at: undefined,
    });
  });
});

describe('runtimeStatusOfView', () => {
  test('states what the service reports, gates included', () => {
    const cases: [PipelineRuntimeState, PipelineRuntimeStatus][] = [
      [PipelineRuntimeState.Active, PipelineRuntimeStatus.Running],
      [PipelineRuntimeState.Paused, PipelineRuntimeStatus.Paused],
      [PipelineRuntimeState.Held, PipelineRuntimeStatus.Held],
      [PipelineRuntimeState.OverBudget, PipelineRuntimeStatus.OverBudget],
      [PipelineRuntimeState.Backpressured, PipelineRuntimeStatus.Backpressured],
    ];

    cases.forEach(([state, expected]) => {
      expect(runtimeStatusOfView(readingState(state), true, PipelineKind.Enrich)).toBe(expected);
    });
  });

  // The runner's vocabulary grew from two to five in one release. Blanking the chip on the next
  // addition would withhold what the console does know: the runner holds this pipeline and answered.
  test('reads a state it does not recognise as running', () => {
    const read = runtimeRead({ view: runtimeView({ status: { state: 'draining' as PipelineRuntimeState } }) });

    expect(runtimeStatusOfView(read, true, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Running);
  });

  // A synced runner that does not hold the pipeline is the one answer that means nothing drives it.
  test('states a pipeline the runner does not hold as not tracked', () => {
    expect(runtimeStatusOfView(readingOutcome(RuntimeReadOutcome.NotHeld), true, PipelineKind.Enrich)).toBe(
      PipelineRuntimeStatus.NotTracked,
    );
  });

  test('states nothing for a disabled pipeline', () => {
    expect(runtimeStatusOfView(runtimeRead(), false, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Unknown);
  });

  test('states a stopped view of an enabled pipeline as not tracked', () => {
    expect(runtimeStatusOfView(readingState(PipelineRuntimeState.Stopped), true, PipelineKind.Enrich)).toBe(
      PipelineRuntimeStatus.NotTracked,
    );
  });

  test('states nothing for a stopped view of a disabled pipeline', () => {
    expect(runtimeStatusOfView(readingState(PipelineRuntimeState.Stopped), false, PipelineKind.Enrich)).toBe(
      PipelineRuntimeStatus.Unknown,
    );
  });

  // The registry drives these on its own scheduler, so the runner's silence is not a fault.
  test('states nothing for an aggregate pipeline', () => {
    expect(runtimeStatusOfView(runtimeRead(), true, PipelineKind.Aggregate)).toBe(PipelineRuntimeStatus.Unknown);
  });

  test('states nothing when the view was not read', () => {
    [RuntimeReadOutcome.Pending, RuntimeReadOutcome.Unavailable, RuntimeReadOutcome.Cold, RuntimeReadOutcome.Failed]
      .map(readingOutcome)
      .forEach((read) => {
        expect(runtimeStatusOfView(read, true, PipelineKind.Enrich)).toBe(PipelineRuntimeStatus.Unknown);
      });
  });
});

describe('isGenerationBehind', () => {
  test('reads a runner revision older than the registry as behind', () => {
    expect(isGenerationBehind(runtimeView({ generation: 6 }), 7)).toBe(true);
  });

  test('reads matching revisions as caught up', () => {
    expect(isGenerationBehind(runtimeView({ generation: 7 }), 7)).toBe(false);
  });

  // The runner can only lag the registry, but a newer one would mean the page is the stale side — and
  // stating it as the runner being behind would be the wrong way round.
  test('reads a runner revision ahead of the registry as not behind', () => {
    expect(isGenerationBehind(runtimeView({ generation: 9 }), 7)).toBe(false);
  });

  test('states nothing without a view', () => {
    expect(isGenerationBehind(undefined, 7)).toBe(false);
  });
});
