import { describe, expect, test } from 'vitest';

import { DiffStatus } from '@/src/types/activity-audit';
import { computeMinimapMarkers } from '../minimap-utils';

const makeContainer = (
  scrollHeight: number,
  clientHeight: number,
  scrollTop: number,
  containerTop: number,
  rows: { className: string; top: number; height: number }[],
): HTMLElement => {
  const container = document.createElement('div');

  Object.defineProperty(container, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: clientHeight, configurable: true });
  Object.defineProperty(container, 'scrollTop', { value: scrollTop, configurable: true });
  container.getBoundingClientRect = () =>
    ({
      top: containerTop,
      height: clientHeight,
      bottom: containerTop + clientHeight,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: containerTop,
      toJSON: () => ({}),
    }) as DOMRect;

  rows.forEach(({ className, top, height }) => {
    const el = document.createElement('div');
    el.className = className;
    el.getBoundingClientRect = () =>
      ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
    container.appendChild(el);
  });

  return container;
};

const makeCollapsedSection = (
  top: number,
  height: number,
  attrs: { added?: boolean; changed?: boolean; removed?: boolean },
): HTMLElement => {
  const section = document.createElement('div');
  section.setAttribute('data-diff-section', '');
  if (attrs.added) section.setAttribute('data-diff-added', '');
  if (attrs.changed) section.setAttribute('data-diff-changed', '');
  if (attrs.removed) section.setAttribute('data-diff-removed', '');
  section.getBoundingClientRect = () =>
    ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
  const accordionRoot = document.createElement('div');
  const content = document.createElement('div');
  content.className = 'flex flex-col overflow-auto hidden';
  accordionRoot.appendChild(content);
  section.appendChild(accordionRoot);

  return section;
};

const makeExpandedSection = (attrs: { added?: boolean; changed?: boolean; removed?: boolean }): HTMLElement => {
  const section = document.createElement('div');
  section.setAttribute('data-diff-section', '');
  if (attrs.added) section.setAttribute('data-diff-added', '');
  if (attrs.changed) section.setAttribute('data-diff-changed', '');

  const accordionRoot = document.createElement('div');
  const content = document.createElement('div');
  content.className = 'flex flex-col overflow-auto';
  accordionRoot.appendChild(content);
  section.appendChild(accordionRoot);

  return section;
};

describe('computeMinimapMarkers', () => {
  test('returns markers even when content does not overflow', () => {
    const container = makeContainer(400, 400, 0, 0, [{ className: 'ag-new-row', top: 10, height: 32 }]);
    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(1);
    expect(markers[0].status).toBe(DiffStatus.ADDED);
  });

  test('returns empty array when scrollHeight is zero', () => {
    const container = makeContainer(0, 0, 0, 0, []);
    expect(computeMinimapMarkers(container)).toEqual([]);
  });

  test('returns empty array when no diff rows exist', () => {
    const container = makeContainer(800, 400, 0, 0, []);
    expect(computeMinimapMarkers(container)).toEqual([]);
  });

  test('maps ag-new-row to ADDED status', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-new-row', top: 16, height: 32 }]);
    expect(computeMinimapMarkers(container)[0].status).toBe(DiffStatus.ADDED);
  });

  test('maps ag-error-row to REMOVED status', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-error-row', top: 16, height: 32 }]);
    expect(computeMinimapMarkers(container)[0].status).toBe(DiffStatus.REMOVED);
  });

  test('maps ag-diff-changed-marker to CHANGED status', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-diff-changed-marker', top: 16, height: 32 }]);
    expect(computeMinimapMarkers(container)[0].status).toBe(DiffStatus.CHANGED);
  });

  test('calculates marker position from top of row', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-new-row', top: 200, height: 32 }]);
    expect(computeMinimapMarkers(container)[0].position).toBeCloseTo(200 / 800);
  });

  test('calculates marker height proportional to row height', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-new-row', top: 100, height: 40 }]);
    expect(computeMinimapMarkers(container)[0].height).toBeCloseTo(40 / 800);
  });

  test('enforces minimum marker height for very small rows', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-new-row', top: 100, height: 1 }]);
    expect(computeMinimapMarkers(container)[0].height).toBeGreaterThanOrEqual(0.004);
  });

  test('accounts for scrollTop when calculating position', () => {
    const container = makeContainer(800, 400, 100, 0, [{ className: 'ag-new-row', top: 50, height: 32 }]);
    expect(computeMinimapMarkers(container)[0].position).toBeCloseTo(150 / 800);
  });

  test('clamps position to [0, 1]', () => {
    const container = makeContainer(800, 400, 0, 0, [{ className: 'ag-new-row', top: 900, height: 32 }]);
    expect(computeMinimapMarkers(container)[0].position).toBe(1);
  });

  test('merges adjacent rows of the same status into a single block', () => {
    const container = makeContainer(800, 400, 0, 0, [
      { className: 'ag-new-row', top: 0, height: 32 },
      { className: 'ag-new-row', top: 32, height: 32 },
    ]);
    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(1);
    expect(markers[0].height).toBeCloseTo(64 / 800);
  });

  test('does not merge rows of the same status with a gap between them', () => {
    const container = makeContainer(800, 400, 0, 0, [
      { className: 'ag-new-row', top: 0, height: 32 },
      { className: 'ag-new-row', top: 100, height: 32 },
    ]);
    expect(computeMinimapMarkers(container)).toHaveLength(2);
  });

  test('does not merge adjacent rows of different statuses', () => {
    const container = makeContainer(800, 400, 0, 0, [
      { className: 'ag-new-row', top: 0, height: 32 },
      { className: 'ag-error-row', top: 32, height: 32 },
    ]);
    expect(computeMinimapMarkers(container)).toHaveLength(2);
  });

  test('returns markers for multiple diff status types', () => {
    const container = makeContainer(800, 400, 0, 0, [
      { className: 'ag-new-row', top: 100, height: 32 },
      { className: 'ag-error-row', top: 300, height: 32 },
      { className: 'ag-diff-changed-marker', top: 500, height: 32 },
    ]);
    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(3);
    expect(markers.map((m) => m.status)).toEqual([DiffStatus.ADDED, DiffStatus.REMOVED, DiffStatus.CHANGED]);
  });

  test('shows marker for collapsed accordion at section position', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
    container.getBoundingClientRect = () =>
      ({ top: 0, height: 400, bottom: 400, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const section = makeCollapsedSection(200, 48, { added: true });
    container.appendChild(section);

    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(1);
    expect(markers[0].status).toBe(DiffStatus.ADDED);
    expect(markers[0].position).toBeCloseTo(200 / 800);
    expect(markers[0].height).toBeCloseTo(48 / 800);
  });

  test('splits accordion height evenly across statuses so markers do not overlap', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
    container.getBoundingClientRect = () =>
      ({ top: 0, height: 400, bottom: 400, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const section = makeCollapsedSection(100, 48, { added: true, removed: true });
    container.appendChild(section);

    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(2);

    const sliceHeight = 48 / 800 / 2;
    expect(markers[0].status).toBe(DiffStatus.ADDED);
    expect(markers[0].position).toBeCloseTo(100 / 800);
    expect(markers[0].height).toBeCloseTo(sliceHeight);

    expect(markers[1].status).toBe(DiffStatus.REMOVED);
    expect(markers[1].position).toBeCloseTo(100 / 800 + sliceHeight);
    expect(markers[1].height).toBeCloseTo(sliceHeight);
  });

  test('splits accordion height evenly across all three statuses', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
    container.getBoundingClientRect = () =>
      ({ top: 0, height: 400, bottom: 400, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const section = makeCollapsedSection(0, 120, { added: true, changed: true, removed: true });
    container.appendChild(section);

    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(3);

    const sliceHeight = 120 / 800 / 3;
    markers.forEach((m, i) => {
      expect(m.position).toBeCloseTo(i * sliceHeight);
      expect(m.height).toBeCloseTo(sliceHeight);
    });
    expect(markers.map((m) => m.status)).toEqual([DiffStatus.ADDED, DiffStatus.CHANGED, DiffStatus.REMOVED]);
  });

  test('skips rows inside collapsed (hidden) accordion content', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
    container.getBoundingClientRect = () =>
      ({ top: 0, height: 400, bottom: 400, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const section = makeCollapsedSection(100, 48, { added: true });
    const hiddenContent = section.querySelector('.hidden') as HTMLElement;
    const row = document.createElement('div');
    row.className = 'ag-new-row';
    row.getBoundingClientRect = () =>
      ({ top: 110, height: 32, bottom: 142, left: 0, right: 0, width: 0, x: 0, y: 110, toJSON: () => ({}) }) as DOMRect;
    hiddenContent.appendChild(row);
    container.appendChild(section);

    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(1);
  });

  test('shows real row positions for expanded accordion, not section bounds', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
    container.getBoundingClientRect = () =>
      ({ top: 0, height: 400, bottom: 400, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const section = makeExpandedSection({ added: true });
    const content = section.querySelector('.flex-col:not(.hidden)') as HTMLElement;
    const row = document.createElement('div');
    row.className = 'ag-new-row';
    row.getBoundingClientRect = () =>
      ({ top: 350, height: 32, bottom: 382, left: 0, right: 0, width: 0, x: 0, y: 350, toJSON: () => ({}) }) as DOMRect;
    content.appendChild(row);
    container.appendChild(section);

    const markers = computeMinimapMarkers(container);
    expect(markers).toHaveLength(1);
    expect(markers[0].position).toBeCloseTo(350 / 800);
  });
});
