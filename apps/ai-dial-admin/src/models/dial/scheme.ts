export interface DialScheme {
  properties?: Record<string, DialSchemeProperty>;
  $defs?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface DialSchemeProperty {
  title?: string;
  type?: string;
  anyOf?: DialSchemePropertyType[];
  oneOf?: DialSchemePropertyType[];
  items?: DialSchemeProperty;
  $ref?: string;
  [key: string]: unknown;
}

export interface DialSchemePropertyType {
  type?: string;
  items?: DialSchemeProperty;
  $ref?: string;
  [key: string]: unknown;
}
