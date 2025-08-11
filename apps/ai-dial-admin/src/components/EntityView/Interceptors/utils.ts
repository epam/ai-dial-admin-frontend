import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN, DRAGGABLE_COL_DEF } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { NAME_COLUMN, DESCRIPTION_COLUMN } from '@/src/constants/grid-columns/grid-columns';

export const getInterceptorsGridData = (
  interceptors?: DialBaseEntity[],
  interceptorNames?: string[],
): DialBaseEntity[] => {
  return (
    interceptorNames
      ?.map((name) => interceptors?.find((interceptor) => interceptor.name === name) as DialBaseEntity)
      .filter(Boolean) || []
  );
};

export const getInterceptorsColumnDefs = (
  remove: (entity: DialBaseEntity, index: number) => void,
  open: (entity: DialBaseEntity) => void,
): ColDef[] => [
  DRAGGABLE_COL_DEF,
  {
    headerName: 'Order',
    field: 'order',
    valueGetter: (params) => (params.node?.rowIndex || 0) + 1,
    width: 86,
  },
  NAME_COLUMN,
  DESCRIPTION_COLUMN,
  ACTION_COLUMN([getOpenInNewTabOperation(open), getRemoveOperation(remove)]),
];
