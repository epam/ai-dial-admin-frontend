export interface DialScheme {
  properties?: Record<string, DialSchemeProperty>;
  $defs?: Record<string, unknown>;
  required?: string[];
}

export interface DialSchemeProperty {
  title?: string;
  type?: string;
  anyOf?: DialSchemePropertyType[];
  oneOf?: DialSchemePropertyType[];
  items?: DialSchemeProperty;
  $ref?: string;
}

export interface DialSchemePropertyType {
  type?: string;
  items?: DialSchemeProperty;
  $ref?: string;
}
