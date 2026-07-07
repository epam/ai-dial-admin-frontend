// Analytics 2.0 — queryable entities and their field schemas.
// Mirrors the analytics-data-access-service `/v1/queries/entities` responses.

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
  complex?: boolean;
  schemaIdField?: string;
}

export interface AnalyticsEntityField {
  name: string;
  type: AnalyticsFieldType;
  source: string;
  tag?: string;
}

export interface AnalyticsEntitySchema {
  fields: AnalyticsEntityField[];
}
