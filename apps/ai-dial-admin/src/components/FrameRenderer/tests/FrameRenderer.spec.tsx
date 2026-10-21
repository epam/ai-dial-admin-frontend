import { render } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { FrameMessageType } from '@/src/components/FrameRenderer/constants';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { FrameRendererHandle } from '@/src/components/FrameRenderer/models';
import {
  FRAME_NAME,
  FRAME_ORIGIN,
  FRAME_URL,
  postFromFrame,
  spyOnFramePostMessage,
} from '@/src/components/FrameRenderer/tests/frame-test-utils';

const callbacks = {
  onDirtyChange: vi.fn(),
  onValidityChange: vi.fn(),
  onSaveSuccess: vi.fn(),
  onSaveError: vi.fn(),
  onMessage: vi.fn(),
};

const renderFrame = (iframeUrl = FRAME_URL) => {
  const ref = createRef<FrameRendererHandle>();
  const view = render(<FrameRenderer ref={ref} iframeUrl={iframeUrl} name={FRAME_NAME} {...callbacks} />);

  return { ...view, ref };
};

describe('FrameRenderer — incoming bare messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reports dirty state from the iframe window', () => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty: true } });
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(true);

    postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty: false } });
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  test('reports save success', () => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.SaveSuccess, hasChanges: true });

    expect(callbacks.onSaveSuccess).toHaveBeenCalledOnce();
  });

  test.each([
    ['nested', { payload: { error: 'nested text' } }, 'nested text'],
    ['flat', { error: 'flat text' }, 'flat text'],
    ['missing', {}, undefined],
  ])('reports save error with %s text', (_label, extra, expected) => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.SaveError, ...extra });

    expect(callbacks.onSaveError).toHaveBeenCalledWith(expected);
  });

  test('ignores messages from another window', () => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty: true } }, { source: window });

    expect(callbacks.onDirtyChange).not.toHaveBeenCalled();
  });

  test('ignores messages from another origin', () => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.SaveSuccess }, { origin: 'https://evil.example.com' });

    expect(callbacks.onSaveSuccess).not.toHaveBeenCalled();
  });

  test('ignores every bare message when the iframe url is unparsable', () => {
    renderFrame('');

    postFromFrame({ type: FrameMessageType.SaveSuccess });

    expect(callbacks.onSaveSuccess).not.toHaveBeenCalled();
  });

  test.each(['AUTO_SAVE_COMPLETE', 'HEIGHT_CHANGE', 'REQUEST_TOOLSET_LOGIN'])('ignores unhandled %s', (type) => {
    renderFrame();

    postFromFrame({ type });

    expect(callbacks.onDirtyChange).not.toHaveBeenCalled();
    expect(callbacks.onSaveSuccess).not.toHaveBeenCalled();
    expect(callbacks.onSaveError).not.toHaveBeenCalled();
    expect(callbacks.onMessage).not.toHaveBeenCalled();
  });

  test('still forwards prefixed legacy messages to onMessage', () => {
    renderFrame();

    postFromFrame({ type: `${FRAME_NAME}/sendMessage`, payload: { isChanged: true } });

    expect(callbacks.onMessage).toHaveBeenCalledOnce();
    expect(callbacks.onDirtyChange).not.toHaveBeenCalled();
  });
});

describe('FrameRenderer — form validity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reports validity from the iframe window', () => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid: false } });
    expect(callbacks.onValidityChange).toHaveBeenLastCalledWith(false);

    postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid: true } });
    expect(callbacks.onValidityChange).toHaveBeenLastCalledWith(true);
  });

  test.each([
    ['without a payload', {}],
    ['with a non-boolean isValid', { payload: { isValid: 'false' } }],
  ])('ignores a validity message %s', (_label, extra) => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.ValidityState, ...extra });

    expect(callbacks.onValidityChange).not.toHaveBeenCalled();
  });

  test('ignores a validity message from another window', () => {
    renderFrame();

    postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid: false } }, { source: window });

    expect(callbacks.onValidityChange).not.toHaveBeenCalled();
  });

  test('ignores a validity message from another origin', () => {
    renderFrame();

    postFromFrame(
      { type: FrameMessageType.ValidityState, payload: { isValid: false } },
      { origin: 'https://evil.example.com' },
    );

    expect(callbacks.onValidityChange).not.toHaveBeenCalled();
  });

  test('reports valid again when an invalid iframe unmounts', () => {
    const { unmount } = renderFrame();
    postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid: false } });

    unmount();

    expect(callbacks.onValidityChange).toHaveBeenLastCalledWith(true);
  });

  test('stays silent on unmount when the form was never reported invalid', () => {
    const { unmount } = renderFrame();

    unmount();

    expect(callbacks.onValidityChange).not.toHaveBeenCalled();
  });
});

describe('FrameRenderer — resetting with the iframe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('clears dirty state on unmount', () => {
    const { unmount } = renderFrame();
    postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty: true } });

    unmount();

    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  test('clears dirty and validity state when the iframe url changes', () => {
    const { rerender, ref } = renderFrame();
    postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty: true } });
    postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid: false } });

    rerender(<FrameRenderer ref={ref} iframeUrl="https://other.example.com/editor" name={FRAME_NAME} {...callbacks} />);

    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(callbacks.onValidityChange).toHaveBeenLastCalledWith(true);
  });
});

describe('FrameRenderer — handle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each([
    ['triggerSave', FrameMessageType.TriggerSave],
    ['reset', FrameMessageType.Reset],
  ] as const)('%s posts a bare message to the iframe origin', (method, type) => {
    const { ref } = renderFrame();
    const postMessage = spyOnFramePostMessage();

    ref.current?.[method]();

    expect(postMessage).toHaveBeenCalledWith({ type }, FRAME_ORIGIN);
  });

  test('sends nothing when the iframe url is unparsable', () => {
    const { ref } = renderFrame('');
    const postMessage = spyOnFramePostMessage();

    ref.current?.triggerSave();

    expect(postMessage).not.toHaveBeenCalled();
  });
});
