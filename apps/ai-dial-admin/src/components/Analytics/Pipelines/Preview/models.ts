import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { ModelRunEvaluation } from '@/src/models/analytics/pipeline-model-run';
import { PreviewRow } from '@/src/models/analytics/pipeline-preview';

/**
 * One count chip of the run bar: the figure, the whole it is a part of when the sample is narrower, and the
 * i18n key of the caption it is read with.
 */
export interface PreviewChip {
  count: number;
  total?: number;
  labelKey: PipelinePreviewI18nKey;
}

/** A refused or failed run: the service's machine code and its own message, untouched. */
export interface PreviewFailure {
  code?: string;
  message?: string;
  status?: number;
  isModelRun?: boolean;
}

export enum PreviewFailureKind {
  Validation = 'validation',
  Budget = 'budget',
  NoAccess = 'noAccess',
  Storage = 'storage',
  Generic = 'generic',
  ModelRunInProgress = 'modelRunInProgress',
  SpendBudget = 'spendBudget',
  RateLimited = 'rateLimited',
  NotRunnable = 'notRunnable',
  SampleUnavailable = 'sampleUnavailable',
  ModelRunUnsupported = 'modelRunUnsupported',
}

export enum PreviewRunKind {
  Preview = 'preview',
  Model = 'model',
}

export enum ModelRunStageState {
  Passed = 'passed',
  Failed = 'failed',
  NotReached = 'notReached',
}

export interface ModelRunStageEntry {
  stage: string;
  state: ModelRunStageState;
}

export enum PreviewEmptyKind {
  NoData = 'noData',
  NoMatch = 'noMatch',
  NoGroup = 'noGroup',
  Held = 'held',
}

/** A part of the declaration an action on the Preview tab opens; `Properties` alone is no particular part. */
export enum PreviewSection {
  Properties = 'properties',
  GroupKeys = 'groupKeys',
  Inputs = 'inputs',
  MemberSelection = 'memberSelection',
  RequestTemplate = 'requestTemplate',
}

/**
 * One row of the sample as the grid holds it. The grid identifies a row by its content unless told otherwise, and a
 * group's members can read identically in the few columns the sample carries — five members would collapse to the
 * distinct ones — so each row carries the place it came in.
 */
export interface PreviewGridRow {
  index: number;
  values: PreviewRow;
}

export interface PreviewGridModelRun {
  evaluation: ModelRunEvaluation;
  evaluatedIndex: number;
  isPanelExpanded: boolean;
  onTogglePanel: () => void;
}
