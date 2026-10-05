import { PipelineRuntimeViewRead } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-runtime-view';
import { isRunnerDriven } from '@/src/components/Analytics/Pipelines/Common/use-paused-pipelines';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import {
  PipelinePause,
  PipelineRuntimeState,
  PipelineRuntimeStatus,
  PipelineRuntimeView,
  RuntimeReadOutcome,
  RuntimeStatus,
} from '@/src/models/analytics/pipeline-runtime';

/** What the chip states for each state the service reports. */
const STATUS_OF_STATE: Record<PipelineRuntimeState, PipelineRuntimeStatus> = {
  [PipelineRuntimeState.Active]: PipelineRuntimeStatus.Running,
  [PipelineRuntimeState.Paused]: PipelineRuntimeStatus.Paused,
  [PipelineRuntimeState.Held]: PipelineRuntimeStatus.Held,
  [PipelineRuntimeState.OverBudget]: PipelineRuntimeStatus.OverBudget,
  [PipelineRuntimeState.Backpressured]: PipelineRuntimeStatus.Backpressured,
};

/**
 * The pause the runner is enforcing, or nothing.
 *
 * Keyed on the state alone, and on nothing else. The members the banner would like — who took the
 * pause and when — are held in the runner's memory and a restart can lose them while the pause itself
 * survives, so requiring them meant a paused pipeline whose chip said `Paused` while the banner, and
 * with it the only Resume control on the page, silently did not render. The banner states what it has.
 */
export const pauseOf = (status?: RuntimeStatus): PipelinePause | undefined => {
  if (status?.state !== PipelineRuntimeState.Paused) return undefined;

  return { origin: status.origin, reason: status.reason, since: status.since, resumes_at: status.resumes_at };
};

/**
 * What the detail page states about one pipeline's runtime, from its own view.
 *
 * Unlike the listing's derivation this takes the service's verdict rather than reconstructing one: the
 * runner resolves the state by the same rules its status log uses, so a second opinion computed here
 * could only disagree with the log an operator is reading beside the console.
 *
 * A state this console does not recognise reads as `Running` rather than as nothing. The runner's
 * vocabulary grew from two to five in one release, and a console that blanked the chip on the next
 * addition would be withholding what it does know — that the runner holds this pipeline and answered
 * for it — on the strength of one word it has not learned yet.
 *
 * `Unknown` is for the cases where nothing can be stated at all: a disabled pipeline, a kind the runner
 * does not drive, and a read that did not land.
 */
export const runtimeStatusOfView = (
  read: PipelineRuntimeViewRead,
  isEnabled: boolean,
  kind: PipelineKind,
): PipelineRuntimeStatus => {
  if (!isEnabled || !isRunnerDriven(kind)) return PipelineRuntimeStatus.Unknown;
  if (read.outcome === RuntimeReadOutcome.NotHeld) return PipelineRuntimeStatus.NotTracked;
  if (!read.view) return PipelineRuntimeStatus.Unknown;

  return STATUS_OF_STATE[read.view.status.state] ?? PipelineRuntimeStatus.Running;
};

/**
 * Whether to offer the pause and resume controls.
 *
 * Deliberately **not** the same question as what the chip states. A read that did not land leaves the
 * console with nothing to state and the pipeline still running — and the moment an operator most wants
 * to stop a pipeline is the moment its runtime read is failing. Withholding the control there was the
 * regression that collapsing two runner reads into one introduced: the old pair failed independently,
 * and the rule written against it was to keep the affordance rather than withhold it on a guess.
 *
 * Two answers do withhold it. A pipeline the runner does not hold has no work to stop. And nothing is
 * offered before the first answer, so the control does not appear as `Pause` and then turn into
 * `Resume` a moment later on a pipeline that was paused all along.
 */
export const isPauseOfferedFor = (read: PipelineRuntimeViewRead, isEnabled: boolean, kind: PipelineKind): boolean => {
  if (!isEnabled || !isRunnerDriven(kind)) return false;

  return read.outcome !== RuntimeReadOutcome.NotHeld && read.outcome !== RuntimeReadOutcome.Pending;
};

/**
 * Whether the runner is executing an older declaration than the one on screen.
 *
 * It syncs on its own cadence, so a difference right after a save is ordinary and clears by itself —
 * which is exactly why it is worth stating: without it, an operator who has just saved reads an
 * unchanged runtime as evidence the save did nothing.
 */
export const isGenerationBehind = (view: PipelineRuntimeView | undefined, generation: number): boolean =>
  view != null && view.generation < generation;
