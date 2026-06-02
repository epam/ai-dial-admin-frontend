import { CellClickedEvent } from 'ag-grid-community';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

/** Mouse flags used to decide same-tab vs new-tab navigation. */
export type ClickModifier = Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'button'>;

export const shouldOpenInNewTab = (event?: ClickModifier | null): boolean =>
  Boolean(event?.ctrlKey || event?.metaKey || event?.button === 1);

export const navigateEntityUrl = (url: string, push: (url: string) => void, event?: ClickModifier | null): void => {
  if (shouldOpenInNewTab(event)) {
    window.open(url, '_blank');
    return;
  }
  push(url);
};

export const onCellClicked = (e: CellClickedEvent, route: ApplicationRoute, push: (url: string) => void): void => {
  if (e.colDef.field === ACTIONS_COLUMN_CEL_ID) return;
  const event = e.event as MouseEvent | undefined;
  navigateEntityUrl(getUrnForEntity(route, e.data), push, event);
};
