import { TEMPLATE_VARIABLE_TYPE_BY_HINT } from '@/src/components/TestSuites/utils/constants';

export const TEMPLATE_SYNTAX_ROWS = [
  {
    format: '${{varName}}',
    example: '${{prompt}}',
    description: 'Simple variable — must be provided via a binding or constant.',
  },
  {
    format: '${{varName:default}}',
    example: '${{temperature:0.7}}',
    description: 'Variable with a fallback default value used when no binding is set.',
  },
  {
    format: '${{varName|type}}',
    example: '${{document|file}}',
    description: 'Variable with a type hint that controls how the value is treated.',
  },
  {
    format: '${{varName|type:default}}',
    example: '${{ctx|file:public/data.txt}}',
    description: 'Variable with both a type hint and a default value.',
  },
] as const;

/** Derived from the parser's own map, so the documented list cannot drift from what a hint resolves to. */
export const TEMPLATE_VARIABLE_TYPES = Object.keys(TEMPLATE_VARIABLE_TYPE_BY_HINT);
