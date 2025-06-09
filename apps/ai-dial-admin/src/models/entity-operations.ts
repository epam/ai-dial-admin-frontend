import { GridApi, IRowNode } from 'ag-grid-community';
import { ReactNode } from 'react';
import { EntityOperation } from '@/src/types/entity-operations';

export interface EntityOperationDeclaration<T> {
  icon: ReactNode;
  id: EntityOperation;
  onClick: (entity: T) => void;
  hidden?: (api: GridApi, node: IRowNode) => boolean;
}
