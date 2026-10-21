import { act, render, screen } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';

import TagsCellRenderer from '../TagsCellRenderer';

const CONTAINER_WIDTH = 300;
const TAG_WIDTH = 100;
const COUNTER_WIDTH = 40;

const METRICS = ['Accuracy', 'Relevance', 'Groundedness', 'Toxicity', 'Latency'];

/**
 * jsdom reports every width as 0, which would collapse the cell to a bare `+N`. The stub gives the
 * container and the off-screen measurement tags real widths, keyed off the classes the renderer sets
 * on each, so the visible count is the one the layout arithmetic would actually produce.
 */
let containerWidth = CONTAINER_WIDTH;

const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get(this: HTMLElement) {
    if (!this.classList.contains('inline-block')) {
      return containerWidth;
    }
    return this.textContent?.startsWith('+') ? COUNTER_WIDTH : TAG_WIDTH;
  },
});

afterAll(() => {
  if (originalOffsetWidth) {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  }
});

// The renderer recomputes on resize, and the shared ResizeObserver mock exposes no instances, so this
// one keeps the callbacks reachable.
const resizeCallbacks: ResizeObserverCallback[] = [];

class CapturingResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const resizeTo = (width: number) => {
  containerWidth = width;
  act(() => {
    resizeCallbacks.forEach((callback) => callback([], {} as ResizeObserver));
  });
};

/** The visible tags only — the off-screen measurement copies live in the sibling `.invisible` block. */
const visibleTagNames = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(':scope > div > div:not(.invisible)')).map((el) => el.textContent);

describe('TagsCellRenderer', () => {
  beforeEach(() => {
    containerWidth = CONTAINER_WIDTH;
    resizeCallbacks.length = 0;
    global.ResizeObserver = CapturingResizeObserver as unknown as typeof ResizeObserver;
  });

  test('renders no tags and no overflow badge for an empty set', () => {
    const { container } = render(<TagsCellRenderer items={[]} />);

    expect(visibleTagNames(container)).toEqual([]);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('renders nothing at all when the row carries no value', () => {
    const { container } = render(<TagsCellRenderer items={undefined as unknown as string[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders a single tag in full, with no overflow badge', () => {
    const { container } = render(<TagsCellRenderer items={['Accuracy']} />);

    expect(visibleTagNames(container)).toEqual(['Accuracy']);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('counts every tag it could not fit in the overflow badge', () => {
    const { container } = render(<TagsCellRenderer items={METRICS} />);

    // 300px fits two 100px tags plus the 8px gaps; the badge stands for the remaining three.
    expect(visibleTagNames(container)).toEqual(['Accuracy', 'Relevance']);
    expect(screen.getByRole('button').textContent).toContain('+3');
  });

  test('makes the names behind the badge reachable by keyboard, not hover alone', () => {
    render(<TagsCellRenderer items={METRICS} />);

    const badge = screen.getByRole('button', { name: /Groundedness, Toxicity, Latency/ });

    expect(badge.tagName).toBe('BUTTON');
  });

  test('recomputes the visible count when the column is resized', () => {
    const { container } = render(<TagsCellRenderer items={METRICS} />);

    resizeTo(150);

    expect(visibleTagNames(container)).toEqual(['Accuracy']);
    expect(screen.getByRole('button', { name: /Relevance, Groundedness, Toxicity, Latency/ }).textContent).toContain(
      '+4',
    );
  });
});
