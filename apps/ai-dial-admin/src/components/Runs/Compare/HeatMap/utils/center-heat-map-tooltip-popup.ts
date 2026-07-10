import { PostProcessPopupParams } from 'ag-grid-community';

import { HeatMapRow } from '@/src/components/Runs/Compare/HeatMap/models';

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

export const resolveCenteredPopupLeft = (
  anchorCenterX: number,
  parentLeft: number,
  parentWidth: number,
  popupWidth: number,
): number => {
  let left = anchorCenterX - parentLeft - popupWidth / 2;
  const maxLeft = parentWidth - popupWidth;
  return Math.max(0, Math.min(left, maxLeft));
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

export const resolveHeatMapTooltipCellElement = (
  params: PostProcessPopupParams<HeatMapRow>,
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

export const centerHeatMapTooltipPopup = (params: PostProcessPopupParams<HeatMapRow>): boolean => {
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
  const anchorCenterX = cellRect.left + cellRect.width / 2;
  const offsetParent = popup.offsetParent as HTMLElement | null;
  const parentRect = offsetParent?.getBoundingClientRect();

  if (!parentRect) {
    return false;
  }

  popup.style.left = `${resolveCenteredPopupLeft(anchorCenterX, parentRect.left, parentRect.width, popupWidth)}px`;

  return true;
};
