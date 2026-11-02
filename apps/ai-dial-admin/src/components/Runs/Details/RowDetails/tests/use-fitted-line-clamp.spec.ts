import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useFittedLineClamp } from '../use-fitted-line-clamp';

class ObserverStub {
  static instances: ObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(private callback: ResizeObserverCallback) {
    ObserverStub.instances.push(this);
  }

  fire() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

const createContainer = (height: number, lineHeight?: string) => {
  const container = document.createElement('div');
  const text = document.createElement('span');
  if (lineHeight) text.style.lineHeight = lineHeight;
  container.append(text);
  const state = { height };
  Object.defineProperty(container, 'clientHeight', { configurable: true, get: () => state.height });
  return { container, state };
};

describe('useFittedLineClamp', () => {
  beforeEach(() => {
    ObserverStub.instances = [];
    vi.stubGlobal('ResizeObserver', ObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('leaves the text unclamped until a container is attached', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());

    expect(result.current.lineClamp).toBeUndefined();
  });

  test('fits the whole lines of the text line height into the container height', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container } = createContainer(100, '25px');

    act(() => result.current.containerRef(container));

    expect(result.current.lineClamp).toBe(4);
  });

  test('falls back to a 20px line when the text reports no usable line height', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container } = createContainer(100);

    act(() => result.current.containerRef(container));

    expect(result.current.lineClamp).toBe(5);
  });

  test('keeps at least one line for a container shorter than a line', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container } = createContainer(8, '20px');

    act(() => result.current.containerRef(container));

    expect(result.current.lineClamp).toBe(1);
  });

  test('stays unclamped for a container that has not been laid out', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container } = createContainer(0, '20px');

    act(() => result.current.containerRef(container));

    expect(result.current.lineClamp).toBeUndefined();
  });

  test('follows the container when it is resized', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container, state } = createContainer(100, '20px');
    act(() => result.current.containerRef(container));
    expect(result.current.lineClamp).toBe(5);

    state.height = 60;
    act(() => ObserverStub.instances[0].fire());

    expect(result.current.lineClamp).toBe(3);
  });

  test('observes the container and stops when it is detached', () => {
    const { result } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container } = createContainer(100, '20px');

    act(() => result.current.containerRef(container));
    expect(ObserverStub.instances[0].observe).toHaveBeenCalledWith(container);

    act(() => result.current.containerRef(null));

    expect(ObserverStub.instances[0].disconnect).toHaveBeenCalledOnce();
  });

  test('stops observing on unmount', () => {
    const { result, unmount } = renderHook(() => useFittedLineClamp<HTMLDivElement>());
    const { container } = createContainer(100, '20px');
    act(() => result.current.containerRef(container));

    unmount();

    expect(ObserverStub.instances[0].disconnect).toHaveBeenCalledOnce();
  });
});
