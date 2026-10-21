/**
 * Models of the eval service's query-entity metadata (`GET api/v1/queries/entities` and
 * `.../entities/schema/{name}`). Wire field names match the backend records verbatim, as they do in
 * {@link ../evaluation/structured-query}.
 */

export enum QueryFieldType {
  Uuid = 'uuid',
  String = 'string',
  Integer = 'integer',
  Long = 'long',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Timestamp = 'timestamp',
  Object = 'object',
  Array = 'array',
}

export interface QueryEntity {
  name: string;
}

/**
 * A queryable field. `name` is what a query names — a nested field is addressed with `::`
 * (`deployment_ref::name`) — while `source` is the physical column it is projected from, so several
 * fields can share one source (every `suite_snapshot` path does).
 */
export interface QueryEntityField {
  name: string;
  type: QueryFieldType;
  source: string;
}

export interface QueryEntitySchema {
  entity: string;
  /** Whether the entity spans more than one physical table, which limits what can be pushed down. */
  complex: boolean;
  fields: QueryEntityField[];
}
