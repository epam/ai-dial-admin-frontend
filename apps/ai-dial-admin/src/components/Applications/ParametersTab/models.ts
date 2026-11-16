export interface ApplicationPropertyRow {
  key: string;
  value: unknown;
  type: string;
  /** Types the schema allows for a schema-derived row (`anyOf` / `oneOf`); `type` is the active one. */
  allowedTypes?: string[];
  required: boolean;
  isFromScheme?: boolean;
}

export interface UserParamRow {
  key: string;
  type: string;
}
