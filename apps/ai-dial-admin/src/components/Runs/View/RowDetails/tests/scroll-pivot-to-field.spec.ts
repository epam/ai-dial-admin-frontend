import { afterEach, describe, expect, test, vi } from 'vitest';

import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

const mockScrollInsets = (
  container: HTMLElement,
  target: HTMLElement,
  padding: { top?: number; left?: number },
  margin: { top?: number; left?: number } = {},
) => {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const isContainer = el === container;
    const isTarget = el === target;
    return {
      scrollPaddingTop: `${isContainer ? (padding.top ?? 0) : 0}px`,
      scrollPaddingLeft: `${isContainer ? (padding.left ?? 0) : 0}px`,
      scrollMarginTop: `${isTarget ? (margin.top ?? 0) : 0}px`,
      scrollMarginLeft: `${isTarget ? (margin.left ?? 0) : 0}px`,
    } as CSSStyleDeclaration;
  });
};

describe('scrollPivotToField', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('no-ops when container or field key is missing', () => {
    expect(() => scrollPivotToField(null, 'http')).not.toThrow();
    expect(() => scrollPivotToField(document.createElement('div'), null)).not.toThrow();
  });

  test('scrolls the matching data-field-key element into view', () => {
    const container = document.createElement('div');
    const cell = document.createElement('button');
    cell.setAttribute('data-field-key', 'httpStatusCode');
    container.appendChild(cell);

    Object.defineProperty(container, 'scrollLeft', { value: 0, writable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
    const scrollTo = vi.fn();
    container.scrollTo = scrollTo;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 100));
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(400, 0, 100, 40));
    mockScrollInsets(container, cell, {});

    scrollPivotToField(container, 'httpStatusCode');

    expect(scrollTo).toHaveBeenCalledWith({ left: 400, top: 0, behavior: 'auto' });
  });

  test('offsets by container scroll-padding-left so the field is not covered', () => {
    const container = document.createElement('div');
    const cell = document.createElement('button');
    cell.setAttribute('data-field-key', 'exact_match');
    container.appendChild(cell);

    Object.defineProperty(container, 'scrollLeft', { value: 0, writable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
    const scrollTo = vi.fn();
    container.scrollTo = scrollTo;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 100));
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(400, 0, 100, 40));
    mockScrollInsets(container, cell, { left: 50 });

    scrollPivotToField(container, 'exact_match');

    expect(scrollTo).toHaveBeenCalledWith({ left: 350, top: 0, behavior: 'auto' });
  });

  test('does not scroll vertically when the field is already fully in view', () => {
    const container = document.createElement('div');
    const cell = document.createElement('div');
    cell.setAttribute('data-field-key', 'exact_match');
    container.appendChild(cell);

    Object.defineProperty(container, 'scrollLeft', { value: 0, writable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
    const scrollTo = vi.fn();
    container.scrollTo = scrollTo;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 800));
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(0, 247, 200, 40));
    mockScrollInsets(container, cell, { top: 68 }, { top: 48 });

    scrollPivotToField(container, 'exact_match');

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test('pins an off-screen row below scroll-padding, with scroll-margin lead', () => {
    const container = document.createElement('div');
    const cell = document.createElement('div');
    cell.setAttribute('data-field-key', 'last_question');
    container.appendChild(cell);

    Object.defineProperty(container, 'scrollLeft', { value: 0, writable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
    const scrollTo = vi.fn();
    container.scrollTo = scrollTo;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 100));
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(0, 500, 200, 40));
    mockScrollInsets(container, cell, { top: 68 }, { top: 48 });

    scrollPivotToField(container, 'last_question');

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 384, behavior: 'auto' });
  });
});
