import { ComponentType, SVGProps } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

export type TypeIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** The details address a row's name links to; `undefined` renders the name as plain text. */
export type EntityHrefGetter<TData = unknown> = (data: TData | undefined) => string | undefined;

export interface DisplayNameCellRendererParams extends ICellRendererParams {
  // When set, replaces the entity icon and the initials fallback with a fixed per-type icon.
  typeIcon?: TypeIconComponent;
  getHref?: EntityHrefGetter;
  isNewTab?: boolean;
}

export interface LinkCellRendererParams<TData = unknown, TValue = unknown> extends ICellRendererParams<TData, TValue> {
  getHref?: EntityHrefGetter<TData>;
  isNewTab?: boolean;
}

export interface EntityLink {
  label: string;
  href?: string;
}

/** Each listed entity of a row; an empty list renders the cell's formatted value as plain text. */
export type EntityLinksGetter<TData = unknown> = (data: TData | undefined) => EntityLink[];

export interface MultiLinkCellRendererParams<TData = unknown, TValue = unknown> extends ICellRendererParams<
  TData,
  TValue
> {
  getLinks?: EntityLinksGetter<TData>;
  isNewTab?: boolean;
}
