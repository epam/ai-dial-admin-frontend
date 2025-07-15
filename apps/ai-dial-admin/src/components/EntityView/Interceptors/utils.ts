import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN, DRAGGABLE_COL_DEF } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

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
  remove: (entity: DialBaseEntity) => void,
  open: (entity: DialBaseEntity) => void,
): ColDef[] => [
  DRAGGABLE_COL_DEF,
  {
    headerName: 'Order',
    field: 'order',
    valueGetter: (params) => (params.node?.rowIndex || 0) + 1,
    width: 86,
  },
  ...SIMPLE_ENTITY_COLUMNS,
  ACTION_COLUMN([getOpenInNewTabOperation(open), getRemoveOperation(remove)]),
];
