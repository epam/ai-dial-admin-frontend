import { InputHTMLAttributes } from 'react';

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

/** The grid's free-text cells a consumer can hand native input attributes to. */
export enum SchemaInputField {
  Name = 'Name',
  Title = 'Title',
  Description = 'Description',
  Tab = 'Tab',
  Section = 'Section',
  Order = 'Order',
}

/** The cell drives value, change, keys, type, id and styling itself, so those stay out of reach. */
export type SchemaFieldInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'onKeyDown' | 'type' | 'id' | 'className'
>;

/** `null` drops that field's defaults; a field left out keeps them. */
export type SchemaFieldInputConfig = Partial<Record<SchemaInputField, SchemaFieldInputProps | null>>;

export type ResolvedSchemaFieldInputProps = Partial<Record<SchemaInputField, SchemaFieldInputProps>>;

export enum SchemaConstraintRule {
  MaxLength = 'maxLength',
  MinLength = 'minLength',
  Pattern = 'pattern',
}

export interface SchemaConstraintViolation {
  field: SchemaInputField;
  rule: SchemaConstraintRule;
  /** The length for the length rules, the pattern source for `pattern`. */
  limit: number | string;
}
