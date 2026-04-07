import { GridApi, IRowNode } from 'ag-grid-community';
import { ReactNode } from 'react';

export interface ActionMenuOperationDeclaration<T> {
  icon: ReactNode;
  id: string;
  label: string;
  onClick: (entity?: T, index?: number) => void;
  hidden?: (api: GridApi, node: IRowNode) => boolean;
  disabled?: boolean;
}
