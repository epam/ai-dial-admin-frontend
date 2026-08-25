enum TypeFamily {
  Numeric = 'numeric',
  Text = 'text',
  Boolean = 'boolean',
  Temporal = 'temporal',
  Structured = 'structured',
}

const FAMILY_BY_TYPE: Record<string, TypeFamily> = {
  integer: TypeFamily.Numeric,
  int: TypeFamily.Numeric,
  long: TypeFamily.Numeric,
  bigint: TypeFamily.Numeric,
  decimal: TypeFamily.Numeric,
  double: TypeFamily.Numeric,
  float: TypeFamily.Numeric,
  number: TypeFamily.Numeric,
  string: TypeFamily.Text,
  text: TypeFamily.Text,
  uuid: TypeFamily.Text,
  boolean: TypeFamily.Boolean,
  bool: TypeFamily.Boolean,
  timestamp: TypeFamily.Temporal,
  datetime: TypeFamily.Temporal,
  date: TypeFamily.Temporal,
  object: TypeFamily.Structured,
  array: TypeFamily.Structured,
  json: TypeFamily.Structured,
};

const familyOf = (type?: string): TypeFamily | undefined =>
  type ? FAMILY_BY_TYPE[type.trim().toLowerCase()] : undefined;

export const isTypeMismatch = (columnType?: string, varType?: string): boolean => {
  const column = familyOf(columnType);
  const variable = familyOf(varType);

  return column != null && variable != null && column !== variable;
};
