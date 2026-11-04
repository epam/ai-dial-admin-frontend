import { PostProcessPopupParams } from 'ag-grid-community';

import {
  HeatMapTooltipAnchor,
  HeatMapTooltipCellResolution,
  HeatMapTooltipCellResolutionSource,
  HeatMapTooltipFrame,
  HeatMapTooltipParentFit,
  HeatMapTooltipPlacement,
  HeatMapTooltipPosition,
} from '@/src/components/Common/HeatMap/models';

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

const resolveHeatMapTooltipParentFit = (
  cellTop: number,
  cellBottom: number,
  parentTop: number,
  parentHeight: number,
  popupHeight: number,
): HeatMapTooltipParentFit => {
  const maxTop = Math.max(0, parentHeight - popupHeight);
  const belowTop = cellBottom - parentTop;
  const aboveTop = cellTop - parentTop - popupHeight;
  return {
    maxTop,
    belowTop,
    aboveTop,
    canFitBelow: belowTop <= maxTop && belowTop >= 0,
    canFitAbove: aboveTop >= 0,
  };
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
  const { maxTop, belowTop, aboveTop, canFitBelow, canFitAbove } = resolveHeatMapTooltipParentFit(
    cellTop,
    cellBottom,
    parentTop,
    parentHeight,
    popupHeight,
  );

  if (canFitBelow) {
    return { top: belowTop, placedAbove: false };
  }
  if (canFitAbove) {
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

const clampToRange = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

/**
 * Fixed position just above or below the cell, in viewport coordinates. The grid wrapper
 * does not clip a fixed popup, so a short heatmap can keep the caret on the cell.
 */
const resolveViewportVerticalPosition = (
  cell: HeatMapTooltipAnchor,
  popupWidth: number,
  popupHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): HeatMapTooltipPosition => {
  const cellBottom = cell.top + cell.height;
  const spaceBelow = viewportHeight - cellBottom;
  const spaceAbove = cell.top;
  const fitsBelow = spaceBelow >= popupHeight;
  const fitsAbove = spaceAbove >= popupHeight;
  const placeBelow = fitsBelow || (!fitsAbove && spaceBelow >= spaceAbove);
  const placement = placeBelow ? HeatMapTooltipPlacement.Below : HeatMapTooltipPlacement.Above;
  const rawTop = placeBelow ? cellBottom : cell.top - popupHeight;
  const top = clampToRange(rawTop, 0, Math.max(0, viewportHeight - popupHeight));
  const rawLeft = cell.left + cell.width / 2 - popupWidth / 2;
  const left = clampToRange(rawLeft, 0, Math.max(0, viewportWidth - popupWidth));

  return {
    left,
    top,
    placement,
    arrowShift: cell.left + cell.width / 2 - (left + popupWidth / 2),
    isFixed: true,
  };
};

/**
 * Below, then above, inside the grid when the popup fits there. Otherwise the same
 * above/below anchor in viewport coordinates, because a fixed popup is not clipped by the grid.
 */
export const resolveHeatMapTooltipPosition = (
  cell: HeatMapTooltipAnchor,
  parent: HeatMapTooltipFrame,
  popupWidth: number,
  popupHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): HeatMapTooltipPosition => {
  const cellBottom = cell.top + cell.height;
  const { canFitBelow, canFitAbove } = resolveHeatMapTooltipParentFit(
    cell.top,
    cellBottom,
    parent.top,
    parent.height,
    popupHeight,
  );

  if (canFitBelow || canFitAbove) {
    const vertical = resolveCenteredPopupTop(cell.top, cellBottom, parent.top, parent.height, popupHeight);
    return {
      left: resolveCenteredPopupLeft(cell.left + cell.width / 2, parent.left, parent.width, popupWidth),
      top: vertical.top,
      placement: vertical.placedAbove ? HeatMapTooltipPlacement.Above : HeatMapTooltipPlacement.Below,
      arrowShift: 0,
      isFixed: false,
    };
  }

  return resolveViewportVerticalPosition(cell, popupWidth, popupHeight, viewportWidth, viewportHeight);
};

const applyHeatMapTooltipPlacement = (popup: HTMLElement, position: HeatMapTooltipPosition): void => {
  popup.style.position = position.isFixed ? 'fixed' : '';
  popup.style.left = `${position.left}px`;
  popup.style.top = `${position.top}px`;
  popup.classList.toggle(HEAT_MAP_TOOLTIP_ABOVE_CLASS, position.placement === HeatMapTooltipPlacement.Above);

  const arrowAnchor = popup.querySelector('.heat-map-cell-tooltip-arrow > div');
  if (arrowAnchor instanceof HTMLElement) {
    arrowAnchor.style.transform = `translateX(calc(-50% + ${position.arrowShift}px))`;
  }
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
  // A previous viewport placement leaves the popup `position: fixed`, which has no offsetParent.
  if (popup.style.position === 'fixed') {
    popup.style.position = 'absolute';
  }
  const offsetParent = popup.offsetParent as HTMLElement | null;
  const parentRect = offsetParent?.getBoundingClientRect();

  if (!parentRect) {
    return false;
  }

  const position = resolveHeatMapTooltipPosition(
    { left: cellRect.left, top: cellRect.top, width: cellRect.width, height: cellRect.height },
    { left: parentRect.left, top: parentRect.top, width: parentRect.width, height: parentRect.height },
    popup.offsetWidth,
    popup.offsetHeight,
    window.innerWidth,
    window.innerHeight,
  );
  applyHeatMapTooltipPlacement(popup, position);

  return true;
};
