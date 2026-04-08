import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN, DRAGGABLE_COL_DEF, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { NAME_COLUMN, DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';

export const getInterceptorsGridData = (
  interceptors?: BaseEntity[],
  interceptorNames?: string[] | null,
): BaseEntity[] => {
  return (
    interceptorNames
      ?.map((name) => interceptors?.find((interceptor) => interceptor.name === name) as BaseEntity)
      .filter(Boolean) || []
  );
};

export const getInterceptorsColumnDefs = (
  open: (entity?: BaseEntity) => void,
  remove?: (entity?: BaseEntity, index?: number) => void,
  startIndex?: number,
): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open)];
  if (remove) {
    actions.push(getRemoveOperation(remove));
  }
  const columns: ColDef[] = [
    remove ? DRAGGABLE_COL_DEF : UTILITY_COLUMN,
    {
      headerName: 'Order',
      field: 'order',
      valueGetter: (params) => (params.node?.rowIndex || 0) + 1 + (startIndex || 0),
      width: 60,
      maxWidth: 60,
      minWidth: 60,
      filter: false,
      floatingFilter: false,
    },
    DISPLAY_NAME_COLUMN,
    DESCRIPTION_COLUMN,
    NAME_COLUMN,
    ACTION_COLUMN(actions),
  ];

  return [...columns];
};
