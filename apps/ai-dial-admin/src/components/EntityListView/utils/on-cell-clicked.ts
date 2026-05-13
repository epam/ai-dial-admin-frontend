import { CellClickedEvent } from 'ag-grid-community';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

export const onCellClicked = (e: CellClickedEvent, route: ApplicationRoute, push: (url: string) => void): void => {
  if (e.colDef.field === ACTIONS_COLUMN_CEL_ID) return;
  const event = e.event as MouseEvent | undefined;
  if (event?.ctrlKey || event?.metaKey || event?.button === 1) {
    window.open(getUrnForEntity(route, e.data), '_blank');
    return;
  }
  push(getUrnForEntity(route, e.data));
};
