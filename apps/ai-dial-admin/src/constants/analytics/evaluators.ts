// A copy of `PIPELINE_NAME_PATTERN` (`Pipelines/Common/use-pipeline-form.ts`) — same console convention
// for a registry name, not a mirror of a service constraint. Not imported: that module is a `'use client'`
// hook and this is a pure constant. A third occurrence should be lifted into one shared constant.
export const EVALUATOR_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
