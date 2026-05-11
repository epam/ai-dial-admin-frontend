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

export const TEMPLATE_VARIABLE_TYPES = ['string', 'integer', 'number', 'boolean', 'object', 'array', 'file'] as const;
