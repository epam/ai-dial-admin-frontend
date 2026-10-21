export enum GridFilterType {
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  EQUALS = 'equals',
  NOT_EQUAL = 'notEqual',
  GREATER_THAN = 'greaterThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN = 'lessThan',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  // Matches any of a comma-joined set of values — backs a fixed-value multiselect filter.
  INCLUDES = 'in',
}
