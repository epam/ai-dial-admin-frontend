import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ModalType } from '@/src/components/EntityView/Modals/constants';
import { useParametersTabGuard } from '@/src/components/EntityView/hooks/use-parameters-tab-guard';
import { PENDING_SAVE_TIMEOUT_MS } from '@/src/components/FrameRenderer/constants';
import { EntityViewTab } from '@/src/utils/tabs/utils';

const LEGACY_SAVE_WAIT_MS = 2000;

const frame = { triggerSave: vi.fn(), reset: vi.fn() };
const connector = { send: vi.fn() } as unknown as VisualizerConnector;

const callbacks = {
  onSaveEntity: vi.fn(),
  onDiscardEntity: vi.fn(),
  onSetActiveTab: vi.fn(),
  onIframeSaveSuccess: vi.fn(),
  onIframeSaveError: vi.fn(),
};

const renderGuard = (props?: { isChanged?: boolean }) => {
  const view = renderHook(() =>
    useParametersTabGuard({
      activeTab: EntityViewTab.Parameters,
      isChanged: props?.isChanged ?? false,
      visualizerConnector: connector,
      ...callbacks,
    }),
  );
  view.result.current.frameRef.current = frame;

  return view;
};

describe('useParametersTabGuard — iframe save lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('tracks the iframe dirty state', () => {
    const { result } = renderGuard();

    act(() => result.current.onFrameDirtyChange(true));
    expect(result.current.isIframeDirty).toBe(true);

    act(() => result.current.onFrameDirtyChange(false));
    expect(result.current.isIframeDirty).toBe(false);
  });

  test('sends TRIGGER_SAVE and marks saving', () => {
    const { result } = renderGuard();

    act(() => result.current.onSaveIframe());

    expect(frame.triggerSave).toHaveBeenCalledOnce();
    expect(result.current.isIframeSaving).toBe(true);
  });

  test('clears saving and dirty on success', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameDirtyChange(true));
    act(() => result.current.onSaveIframe());

    act(() => result.current.onFrameSaveSuccess());

    expect(result.current.isIframeSaving).toBe(false);
    expect(result.current.isIframeDirty).toBe(false);
    expect(callbacks.onIframeSaveSuccess).toHaveBeenCalledOnce();
  });

  test('keeps dirty and reports the message on error', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameDirtyChange(true));
    act(() => result.current.onSaveIframe());

    act(() => result.current.onFrameSaveError('boom'));

    expect(result.current.isIframeSaving).toBe(false);
    expect(result.current.isIframeDirty).toBe(true);
    expect(callbacks.onIframeSaveError).toHaveBeenCalledWith('boom');
  });

  test('reports an error without text when the save never answers', async () => {
    const { result } = renderGuard();
    act(() => result.current.onSaveIframe());

    await act(() => vi.advanceTimersByTimeAsync(PENDING_SAVE_TIMEOUT_MS));

    expect(result.current.isIframeSaving).toBe(false);
    expect(callbacks.onIframeSaveError).toHaveBeenCalledWith(undefined);
  });

  test('ignores save results when no save is pending', () => {
    const { result } = renderGuard();

    act(() => result.current.onFrameSaveSuccess());
    act(() => result.current.onFrameSaveError('late'));

    expect(callbacks.onIframeSaveSuccess).not.toHaveBeenCalled();
    expect(callbacks.onIframeSaveError).not.toHaveBeenCalled();
  });

  test('sends RESET on discard', () => {
    const { result } = renderGuard();

    act(() => result.current.onDiscardIframe());

    expect(frame.reset).toHaveBeenCalledOnce();
  });
});

describe('useParametersTabGuard — form validity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('treats the form as valid until told otherwise', () => {
    const { result } = renderGuard();

    expect(result.current.isIframeValid).toBe(true);
  });

  test('tracks the reported validity', () => {
    const { result } = renderGuard();

    act(() => result.current.onFrameValidityChange(false));
    expect(result.current.isIframeValid).toBe(false);

    act(() => result.current.onFrameValidityChange(true));
    expect(result.current.isIframeValid).toBe(true);
  });

  test('does not send TRIGGER_SAVE while the form is invalid', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameValidityChange(false));

    act(() => result.current.onSaveIframe());

    expect(frame.triggerSave).not.toHaveBeenCalled();
    expect(result.current.isIframeSaving).toBe(false);
  });

  test('sends TRIGGER_SAVE again once the form is valid', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameValidityChange(false));
    act(() => result.current.onFrameValidityChange(true));

    act(() => result.current.onSaveIframe());

    expect(frame.triggerSave).toHaveBeenCalledOnce();
  });

  test('still allows discarding an invalid form', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameValidityChange(false));

    act(() => result.current.onDiscardIframe());

    expect(frame.reset).toHaveBeenCalledOnce();
  });
});

describe('useParametersTabGuard — leaving the Parameters tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('opens the parameters confirmation when the iframe is dirty', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameDirtyChange(true));

    act(() => result.current.onChangeActiveTab(EntityViewTab.Properties));

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.modalType).toBe(ModalType.parameters);
    expect(callbacks.onSetActiveTab).not.toHaveBeenCalled();
  });

  test('switches tab without a prompt when nothing is dirty', () => {
    const { result } = renderGuard();

    act(() => result.current.onChangeActiveTab(EntityViewTab.Properties));

    expect(result.current.isModalOpen).toBe(false);
    expect(callbacks.onSetActiveTab).toHaveBeenCalledWith(EntityViewTab.Properties);
  });

  test('switches tab only after the iframe save succeeds', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameDirtyChange(true));
    act(() => result.current.onChangeActiveTab(EntityViewTab.Properties));

    act(() => result.current.onModalConfirm(ModalType.parameters));

    expect(frame.triggerSave).toHaveBeenCalledOnce();
    expect(connector.send).not.toHaveBeenCalled();
    expect(callbacks.onSetActiveTab).not.toHaveBeenCalled();

    act(() => result.current.onFrameSaveSuccess());

    expect(callbacks.onSetActiveTab).toHaveBeenCalledWith(EntityViewTab.Properties);
  });

  test('stays on the tab when the iframe save fails', async () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameDirtyChange(true));
    act(() => result.current.onChangeActiveTab(EntityViewTab.Properties));
    act(() => result.current.onModalConfirm(ModalType.parameters));

    act(() => result.current.onFrameSaveError('boom'));
    await act(() => vi.advanceTimersByTimeAsync(PENDING_SAVE_TIMEOUT_MS));

    expect(callbacks.onSetActiveTab).not.toHaveBeenCalled();
    expect(callbacks.onIframeSaveError).toHaveBeenCalledWith('boom');
  });

  test('stays on the tab and reports an error when the form is invalid', () => {
    const { result } = renderGuard();
    act(() => result.current.onFrameDirtyChange(true));
    act(() => result.current.onFrameValidityChange(false));
    act(() => result.current.onChangeActiveTab(EntityViewTab.Properties));

    act(() => result.current.onModalConfirm(ModalType.parameters));

    expect(frame.triggerSave).not.toHaveBeenCalled();
    expect(callbacks.onSetActiveTab).not.toHaveBeenCalled();
    expect(callbacks.onIframeSaveError).toHaveBeenCalledOnce();
    expect(result.current.isModalOpen).toBe(false);
  });

  test('keeps the legacy request and wait for a non-dirty iframe', async () => {
    const { result } = renderGuard({ isChanged: true });
    act(() => result.current.onChangeActiveTab(EntityViewTab.Properties));

    act(() => result.current.onModalConfirm(ModalType.parameters));

    expect(frame.triggerSave).not.toHaveBeenCalled();
    expect(connector.send).toHaveBeenCalledOnce();
    expect(callbacks.onSetActiveTab).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(LEGACY_SAVE_WAIT_MS));

    expect(callbacks.onSetActiveTab).toHaveBeenCalledWith(EntityViewTab.Properties);
  });
});
