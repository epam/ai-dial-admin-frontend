import { GridApi, IRowNode } from 'ag-grid-community';
import { ReactNode } from 'react';
import { ActionMenuOperation } from '@/src/types/action-menu-operations';

export interface ActionMenuOperationDeclaration<T> {
  icon: ReactNode;
  id: ActionMenuOperation;
  onClick: (entity?: T, index?: number) => void;
  hidden?: (api: GridApi, node: IRowNode) => boolean;
  disabled?: boolean;
}
