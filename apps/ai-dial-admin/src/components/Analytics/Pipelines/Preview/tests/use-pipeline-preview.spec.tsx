import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { previewMock } from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import { usePipelinePreview } from '@/src/components/Analytics/Pipelines/Preview/use-pipeline-preview';

const { previewPipeline } = vi.hoisted(() => ({ previewPipeline: vi.fn() }));

vi.mock('@/src/app/[lang]/pipelines/actions', () => ({ previewPipeline }));

const success = (preview = previewMock()) => ({ success: true, response: preview });

const refusal = {
  success: false,
  status: 422,
  errorHeader: 'pipeline_validation_failed',
  errorMessage: 'transform.outputs is empty',
};

describe('usePipelinePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('issues no request until a run is asked for', () => {
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    expect(previewPipeline).not.toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.failure).toBeUndefined();
  });

  test('runs the named pipeline and holds the sample with the generation it was issued at', async () => {
    previewPipeline.mockResolvedValueOnce(success());
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    await act(() => result.current.run());

    expect(previewPipeline).toHaveBeenCalledWith('chat-cost-tier');
    expect(result.current.result).toEqual(previewMock());
    expect(result.current.sampledGeneration).toBe(6);
    expect(result.current.isRunning).toBe(false);
  });

  test('is running while the request is in flight', async () => {
    let resolve: (value: ReturnType<typeof success>) => void = () => {};
    previewPipeline.mockReturnValueOnce(new Promise((done) => (resolve = done)));
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.run();
    });
    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      resolve(success());
      await running;
    });
    expect(result.current.isRunning).toBe(false);
  });

  test('keeps the earlier result when a later run is refused, and reports the refusal', async () => {
    previewPipeline.mockResolvedValueOnce(success()).mockResolvedValueOnce(refusal);
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    await act(() => result.current.run());
    await act(() => result.current.run());

    expect(result.current.result).toEqual(previewMock());
    expect(result.current.failure).toEqual({
      code: 'pipeline_validation_failed',
      message: 'transform.outputs is empty',
      status: 422,
    });
  });

  test('clears the failure when a later run succeeds', async () => {
    previewPipeline.mockResolvedValueOnce(refusal).mockResolvedValueOnce(success());
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    await act(() => result.current.run());
    expect(result.current.failure).toBeDefined();

    await act(() => result.current.run());
    expect(result.current.failure).toBeUndefined();
    expect(result.current.result).toEqual(previewMock());
  });

  test('reports a thrown request as a failure with no code, keeping the earlier result', async () => {
    previewPipeline.mockResolvedValueOnce(success()).mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    await act(() => result.current.run());
    await act(() => result.current.run());

    expect(result.current.failure).toEqual({});
    expect(result.current.result).toEqual(previewMock());
    expect(result.current.isRunning).toBe(false);
  });

  test('reports a success with no body as a failure rather than an empty result', async () => {
    previewPipeline.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    await act(() => result.current.run());

    expect(result.current.result).toBeUndefined();
    expect(result.current.failure).toBeDefined();
  });

  test('names the group a rerun left only when the rerun moved to another one', async () => {
    previewPipeline
      .mockResolvedValueOnce(success(previewMock({ group_key: 'A' })))
      .mockResolvedValueOnce(success(previewMock({ group_key: 'B' })))
      .mockResolvedValueOnce(success(previewMock({ group_key: 'B' })));
    const { result } = renderHook(() => usePipelinePreview('chat-cost-tier', 6));

    await act(() => result.current.run());
    expect(result.current.previousGroupKey).toBeUndefined();

    await act(() => result.current.run());
    expect(result.current.previousGroupKey).toBe('A');

    await act(() => result.current.run());
    expect(result.current.previousGroupKey).toBeUndefined();
  });
});
