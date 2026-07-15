export enum AnalyticsFieldType {
  Uuid = 'uuid',
  String = 'string',
  Integer = 'integer',
  Long = 'long',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Date = 'date',
  Timestamp = 'timestamp',
  Object = 'object',
  Array = 'array',
}

export interface AnalyticsEntity {
  name: string;
}

export interface AnalyticsEntityField {
  name: string;
  type: AnalyticsFieldType;
  source: string;
  tag?: string;
  display_name?: string;
  description?: string;
}

export interface AnalyticsEntitySchema {
  fields: AnalyticsEntityField[];
}
