import { act, screen } from '@testing-library/react';
import { Ref } from 'react';
import { vi } from 'vitest';

import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { FrameCallbacks, FrameRendererHandle } from '@/src/components/FrameRenderer/models';

export const FRAME_ORIGIN = 'https://quickapps.example.com';
export const FRAME_URL = `${FRAME_ORIGIN}/editor?id=1`;
export const FRAME_NAME = 'QuickApp';

const FRAME_TITLE = 'visualizer-frame';

interface StubProps {
  frameRef?: Ref<FrameRendererHandle>;
  frameCallbacks?: FrameCallbacks;
}

const getFrameWindow = () => (screen.getByTitle(FRAME_TITLE) as HTMLIFrameElement).contentWindow as Window;

/** Delivers a message to the host the way the browser does: from the iframe's window and origin by default. */
export const postFromFrame = (data: unknown, { origin = FRAME_ORIGIN, source = getFrameWindow() } = {}) => {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  });
};

export const spyOnFramePostMessage = () => vi.spyOn(getFrameWindow(), 'postMessage');

/** Stands in for `TabsContent` in view specs: renders the real `FrameRenderer` with the props the view passes. */
export const FrameTabsContentStub = ({ frameRef, frameCallbacks }: StubProps) => (
  <FrameRenderer ref={frameRef} {...frameCallbacks} iframeUrl={FRAME_URL} name={FRAME_NAME} />
);
