import { PostProcessPopupParams } from 'ag-grid-community';

export enum HeatMapTooltipCellResolutionSource {
  EventSource = 'eventSource',
  Pointer = 'pointer',
  DomQuery = 'domQuery',
  None = 'none',
}

export interface HeatMapTooltipCellResolution {
  element: HTMLElement | null;
  source: HeatMapTooltipCellResolutionSource;
}

export const HEAT_MAP_TOOLTIP_ABOVE_CLASS = 'heat-map-tooltip--above';

export const resolveCenteredPopupLeft = (
  anchorCenterX: number,
  parentLeft: number,
  parentWidth: number,
  popupWidth: number,
): number => {
  const left = anchorCenterX - parentLeft - popupWidth / 2;
  const maxLeft = parentWidth - popupWidth;
  return Math.max(0, Math.min(left, maxLeft));
};

/**
 * Prefer the tooltip just below the cell (arrow on top). When there isn't room in the
 * popup parent, place it above and flip the arrow via {@link HEAT_MAP_TOOLTIP_ABOVE_CLASS}.
 */
export const resolveCenteredPopupTop = (
  cellTop: number,
  cellBottom: number,
  parentTop: number,
  parentHeight: number,
  popupHeight: number,
): { top: number; placedAbove: boolean } => {
  const maxTop = Math.max(0, parentHeight - popupHeight);
  const belowTop = cellBottom - parentTop;
  const aboveTop = cellTop - parentTop - popupHeight;
  const fitsBelow = belowTop <= maxTop && belowTop >= 0;
  const fitsAbove = aboveTop >= 0;

  if (fitsBelow) {
    return { top: belowTop, placedAbove: false };
  }
  if (fitsAbove) {
    return { top: Math.min(aboveTop, maxTop), placedAbove: true };
  }

  // Neither side fits fully — keep the popup in-bounds on the side with more space.
  const spaceBelow = parentTop + parentHeight - cellBottom;
  const spaceAbove = cellTop - parentTop;
  if (spaceBelow >= spaceAbove) {
    return { top: Math.min(belowTop, maxTop), placedAbove: false };
  }
  return { top: Math.max(0, aboveTop), placedAbove: true };
};

const resolveHeatMapTooltipCellFromPointer = (mouseEvent: MouseEvent | Touch): HTMLElement | null => {
  if (!('clientX' in mouseEvent)) {
    return null;
  }

  const cellFromPointer = document
    .elementsFromPoint(mouseEvent.clientX, mouseEvent.clientY)
    .find((element): element is HTMLElement => element instanceof HTMLElement && element.classList.contains('ag-cell'));

  return cellFromPointer ?? null;
};

export const resolveHeatMapTooltipCellElement = <TData>(
  params: PostProcessPopupParams<TData>,
): HeatMapTooltipCellResolution => {
  if (params.eventSource) {
    return { element: params.eventSource, source: HeatMapTooltipCellResolutionSource.EventSource };
  }

  if (params.mouseEvent) {
    const cellFromPointer = resolveHeatMapTooltipCellFromPointer(params.mouseEvent);
    if (cellFromPointer) {
      return { element: cellFromPointer, source: HeatMapTooltipCellResolutionSource.Pointer };
    }
  }

  const colId = params.column?.getColId();
  const rowIndex = params.rowNode?.rowIndex;
  if (colId != null && rowIndex != null) {
    const gridRoot = params.ePopup.closest('.ag-root-wrapper');
    const cellFromDomQuery = gridRoot?.querySelector(`[row-index="${rowIndex}"] [col-id="${colId}"]`);
    if (cellFromDomQuery instanceof HTMLElement) {
      return { element: cellFromDomQuery, source: HeatMapTooltipCellResolutionSource.DomQuery };
    }
  }

  return { element: null, source: HeatMapTooltipCellResolutionSource.None };
};

export const centerHeatMapTooltipPopup = <TData>(params: PostProcessPopupParams<TData>): boolean => {
  if (params.type !== 'tooltip') {
    return false;
  }

  const { element: cellElement } = resolveHeatMapTooltipCellElement(params);
  if (!cellElement) {
    return false;
  }

  const cellRect = cellElement.getBoundingClientRect();
  const popup = params.ePopup;
  const popupWidth = popup.offsetWidth;
  const popupHeight = popup.offsetHeight;
  const anchorCenterX = cellRect.left + cellRect.width / 2;
  const offsetParent = popup.offsetParent as HTMLElement | null;
  const parentRect = offsetParent?.getBoundingClientRect();

  if (!parentRect) {
    return false;
  }

  popup.style.left = `${resolveCenteredPopupLeft(anchorCenterX, parentRect.left, parentRect.width, popupWidth)}px`;

  const { top, placedAbove } = resolveCenteredPopupTop(
    cellRect.top,
    cellRect.bottom,
    parentRect.top,
    parentRect.height,
    popupHeight,
  );
  popup.style.top = `${top}px`;
  popup.classList.toggle(HEAT_MAP_TOOLTIP_ABOVE_CLASS, placedAbove);

  return true;
};
