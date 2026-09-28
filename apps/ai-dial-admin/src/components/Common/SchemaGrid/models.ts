import { SchemaFieldRow } from './utils';

export enum SchemaMetaColumn {
  Order = 'Order',
  PropertyKind = 'PropertyKind',
  Tab = 'Tab',
  Section = 'Section',
  Widget = 'Widget',
  Localized = 'Localized',
}

/** A column is rendered only when its handler is present, so a caller's column set drives both. */
export interface SchemaMetaHandlers {
  [SchemaMetaColumn.Order]?: (value: number | string, data: SchemaFieldRow) => void;
  [SchemaMetaColumn.PropertyKind]?: (value: string, data: SchemaFieldRow) => void;
  [SchemaMetaColumn.Tab]?: (value: string, data: SchemaFieldRow) => void;
  [SchemaMetaColumn.Section]?: (value: string, data: SchemaFieldRow) => void;
  [SchemaMetaColumn.Widget]?: (value: string, data: SchemaFieldRow) => void;
  [SchemaMetaColumn.Localized]?: (value: boolean, data: SchemaFieldRow) => void;
}
