import { EvaluatorVarType } from '@/src/models/analytics/evaluator';

// The aliases the service also accepts (`double`/`float`, `datetime`, `int`, `bool`) are deliberately not
// offered: each stores as a different canonical code, so offering both would let an operator pick a value the
// service silently renames. A variable already carrying one keeps it, via `withStrandedOption`.
export const EVALUATOR_VAR_TYPES: string[] = Object.values(EvaluatorVarType);

// A copy of `PIPELINE_NAME_PATTERN` (`Pipelines/Common/use-pipeline-form.ts`) — same console convention
// for a registry name, not a mirror of a service constraint. Not imported: that module is a `'use client'`
// hook and this is a pure constant. A third occurrence should be lifted into one shared constant.
export const EVALUATOR_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
