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
  sensitive?: boolean;
  // The service omits a heavy field from a wildcard projection because it is expensive to transfer. It is
  // a cost hint rather than access control — a query naming it explicitly still gets it.
  heavy?: boolean;
}

export interface AnalyticsEntitySchema {
  fields: AnalyticsEntityField[];
}
