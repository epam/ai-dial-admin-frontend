import { DiffStatus } from '@/src/types/activity-audit';

export interface MinimapMarker {
  position: number;
  height: number;
  status: DiffStatus.ADDED | DiffStatus.REMOVED | DiffStatus.CHANGED;
}

const ROW_CLASS_STATUS_MAP: [string, DiffStatus.ADDED | DiffStatus.REMOVED | DiffStatus.CHANGED][] = [
  ['ag-new-row', DiffStatus.ADDED],
  ['ag-error-row', DiffStatus.REMOVED],
  ['ag-changed-row', DiffStatus.CHANGED],
];

const COLLAPSED_STATUS_ATTRS: [string, DiffStatus.ADDED | DiffStatus.REMOVED | DiffStatus.CHANGED][] = [
  ['data-diff-added', DiffStatus.ADDED],
  ['data-diff-changed', DiffStatus.CHANGED],
  ['data-diff-removed', DiffStatus.REMOVED],
];

const MIN_MARKER_HEIGHT = 0.004;

const toPosition = (offsetFromTop: number, scrollHeight: number) =>
  Math.min(1, Math.max(0, offsetFromTop / scrollHeight));

const toHeight = (rawHeight: number, scrollHeight: number) => Math.max(MIN_MARKER_HEIGHT, rawHeight / scrollHeight);

export const computeMinimapMarkers = (container: HTMLElement): MinimapMarker[] => {
  const { scrollHeight } = container;
  if (scrollHeight === 0) return [];

  const containerRect = container.getBoundingClientRect();
  const raw: MinimapMarker[] = [];

  container.querySelectorAll('[data-diff-section]').forEach((section) => {
    const isCollapsed = !!section.querySelector(':scope > div > div.hidden');
    if (!isCollapsed) return;

    const rect = section.getBoundingClientRect();
    if (rect.height === 0) return;

    const offsetFromTop = rect.top - containerRect.top + container.scrollTop;
    const position = toPosition(offsetFromTop, scrollHeight);
    const height = toHeight(rect.height, scrollHeight);

    const presentStatuses = COLLAPSED_STATUS_ATTRS.filter(([attr]) => section.hasAttribute(attr)).map(
      ([, status]) => status,
    );
    const sliceHeight = height / presentStatuses.length;
    presentStatuses.forEach((status, i) => {
      raw.push({ position: position + i * sliceHeight, height: sliceHeight, status });
    });
  });

  for (const [className, status] of ROW_CLASS_STATUS_MAP) {
    container.querySelectorAll(`.${className}`).forEach((row) => {
      if (row.closest('.hidden')) return;

      const rowRect = row.getBoundingClientRect();
      const offsetFromTop = rowRect.top - containerRect.top + container.scrollTop;
      raw.push({
        position: toPosition(offsetFromTop, scrollHeight),
        height: toHeight(rowRect.height, scrollHeight),
        status,
      });
    });
  }

  raw.sort((a, b) => a.position - b.position);

  const merged: MinimapMarker[] = [];
  for (const marker of raw) {
    const last = merged[merged.length - 1];
    if (last && last.status === marker.status && marker.position <= last.position + last.height + MIN_MARKER_HEIGHT) {
      last.height = Math.max(last.height, marker.position + marker.height - last.position);
    } else {
      merged.push({ ...marker });
    }
  }

  return merged;
};
