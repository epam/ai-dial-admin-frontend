'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { previewPipeline } from '@/src/app/[lang]/pipelines/actions';
import { PipelinePreview } from '@/src/models/analytics/pipeline-preview';

import { PreviewFailure } from './models';

interface PreviewState {
  /** The last success. A failed run never replaces it. */
  result?: PipelinePreview;
  /** The pipeline's generation when the run that produced `result` was issued. */
  sampledGeneration?: number;
  /** The group sampled before `result`, only when the last rerun moved to another one. */
  previousGroupKey?: string;
  failure?: PreviewFailure;
}

export interface PipelinePreviewRun extends PreviewState {
  isRunning: boolean;
  run: () => Promise<void>;
}

/**
 * Owns the dry-run of one pipeline. It never runs on its own — the read can take as long as the service's
 * budget allows — and it keeps the last result through a failure, so a failed run does not wipe a good one.
 */
export const usePipelinePreview = (pipelineName: string, generation: number): PipelinePreviewRun => {
  const [state, setState] = useState<PreviewState>({});
  const [isRunning, setIsRunning] = useState(false);

  // Only the latest run may land, and none may after the tab is gone.
  const runId = useRef(0);
  useEffect(
    () => () => {
      runId.current++;
    },
    [],
  );

  const run = useCallback(async () => {
    const id = ++runId.current;
    setIsRunning(true);
    setState((prev) => ({ ...prev, failure: undefined }));

    try {
      const res = await previewPipeline(pipelineName);
      if (id !== runId.current) return;

      if (res.success && res.response) {
        const next = res.response;
        setState((prev) => ({
          result: next,
          sampledGeneration: generation,
          previousGroupKey: prev.result?.group_key !== next.group_key ? prev.result?.group_key : undefined,
          failure: undefined,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          failure: { code: res.errorHeader, message: res.errorMessage, status: res.status },
        }));
      }
    } catch {
      if (id !== runId.current) return;

      setState((prev) => ({ ...prev, failure: {} }));
    } finally {
      if (id === runId.current) setIsRunning(false);
    }
  }, [pipelineName, generation]);

  return { ...state, isRunning, run };
};
