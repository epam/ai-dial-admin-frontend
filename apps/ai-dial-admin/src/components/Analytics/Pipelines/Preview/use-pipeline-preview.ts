'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { previewPipeline, runPipelineWithModel } from '@/src/app/[lang]/pipelines/actions';
import { ModelRunEvaluation, PipelineModelRun } from '@/src/models/analytics/pipeline-model-run';
import { PipelinePreview } from '@/src/models/analytics/pipeline-preview';
import { ServerActionResponse } from '@/src/models/server-action';

import { MODEL_RUN_FAILURE_CODES } from './constants';
import { PreviewFailure, PreviewRunKind } from './models';

interface PreviewState {
  /** The last success. A failed run never replaces it. */
  result?: PipelinePreview;
  evaluations?: ModelRunEvaluation[];
  /** The pipeline's generation when the run that produced `result` was issued. */
  sampledGeneration?: number;
  /** The group sampled before `result`, only when the last rerun moved to another one. */
  previousGroupKey?: string;
  failure?: PreviewFailure;
  isModelRunUnsupported?: boolean;
}

export interface PipelinePreviewRun extends PreviewState {
  isRunning: boolean;
  runningKind?: PreviewRunKind;
  run: () => Promise<void>;
  runWithModel: () => Promise<void>;
}

type RunAnswer = Pick<PipelineModelRun, 'preview'> & Partial<Pick<PipelineModelRun, 'evaluations'>>;

const toAnswer = (
  kind: PreviewRunKind,
  res: ServerActionResponse<PipelinePreview | PipelineModelRun>,
): RunAnswer | undefined => {
  if (!res.success || !res.response) return undefined;

  return kind === PreviewRunKind.Model
    ? (res.response as PipelineModelRun)
    : { preview: res.response as PipelinePreview };
};

/**
 * Owns the dry-run of one pipeline. It never runs on its own — the read can take as long as the service's
 * budget allows — and it keeps the last result through a failure, so a failed run does not wipe a good one.
 */
export const usePipelinePreview = (pipelineName: string, generation: number): PipelinePreviewRun => {
  const [state, setState] = useState<PreviewState>({});
  const [runningKind, setRunningKind] = useState<PreviewRunKind>();

  // Only the latest run may land, and none may after the tab is gone.
  const runId = useRef(0);
  useEffect(
    () => () => {
      runId.current++;
    },
    [],
  );

  const issue = useCallback(
    async (kind: PreviewRunKind) => {
      const id = ++runId.current;
      const isModelRun = kind === PreviewRunKind.Model || undefined;
      setRunningKind(kind);
      setState((prev) => ({ ...prev, failure: undefined }));

      try {
        const res = isModelRun ? await runPipelineWithModel(pipelineName) : await previewPipeline(pipelineName);
        if (id !== runId.current) return;

        const answer = toAnswer(kind, res);
        if (answer) {
          setState((prev) => ({
            result: answer.preview,
            evaluations: answer.evaluations,
            sampledGeneration: generation,
            previousGroupKey: prev.result?.group_key !== answer.preview.group_key ? prev.result?.group_key : undefined,
            failure: undefined,
            isModelRunUnsupported: prev.isModelRunUnsupported,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            failure: { code: res.errorHeader, message: res.errorMessage, status: res.status, isModelRun },
            isModelRunUnsupported:
              prev.isModelRunUnsupported || (!!isModelRun && res.errorHeader === MODEL_RUN_FAILURE_CODES.unsupported),
          }));
        }
      } catch {
        if (id !== runId.current) return;

        setState((prev) => ({ ...prev, failure: { isModelRun } }));
      } finally {
        if (id === runId.current) setRunningKind(undefined);
      }
    },
    [pipelineName, generation],
  );

  const run = useCallback(() => issue(PreviewRunKind.Preview), [issue]);
  const runWithModel = useCallback(() => issue(PreviewRunKind.Model), [issue]);

  return { ...state, isRunning: runningKind != null, runningKind, run, runWithModel };
};
