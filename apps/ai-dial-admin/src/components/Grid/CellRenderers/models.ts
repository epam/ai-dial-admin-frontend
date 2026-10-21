import { ComponentType, SVGProps } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

export type TypeIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface DisplayNameCellRendererParams extends ICellRendererParams {
  // When set, replaces the entity icon and the initials fallback with a fixed per-type icon.
  typeIcon?: TypeIconComponent;
}
