// Declaration order is also the order the column-type picker offers these in (`COLUMN_TYPE_OPTIONS` maps
// `Object.values`), and the ui-kit select's option list shows ten rows before it scrolls — with no scrollbar
// at rest on macOS. So every member past the tenth is effectively hidden, and which ones sit there is a real
// choice: `Array` is long-established and looked for, and `Map` is the newest and least looked for, so those
// two take the places past the fold rather than a type people reach for first.
export enum AnalyticsFieldType {
  Uuid = 'uuid',
  String = 'string',
  // A string field whose value set is closed, carried alongside the type as `enum_values` — the type
  // parameter `enum` takes, the way `element_type` is the one `array` takes. Declared order is
  // significant: a value's position becomes its id in the physical type, so the column sorts in declared
  // order rather than alphabetically. A column of this type filters by selecting among the values rather
  // than by free text, and the LIKE-based operators are refused over it. Sits next to `String` because it
  // is one — a closed set of strings.
  Enum = 'enum',
  Integer = 'integer',
  Long = 'long',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Date = 'date',
  Timestamp = 'timestamp',
  Object = 'object',
  Array = 'array',
  // A bag of string keys mapped to string values (ClickHouse `Map(String, String)`), with no key or value
  // type of its own. It is projection-only on the query surface — no comparison, grouping or ordering over
  // it — so a key is read through a catalog function, and it can never key a table or be nullable.
  Map = 'map',
}

export interface AnalyticsEntity {
  name: string;
}

export interface AnalyticsEntityField {
  name: string;
  type: AnalyticsFieldType;
  // Present only on an Enum field: its closed value set, in declared (sort) order.
  enum_values?: string[];
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
