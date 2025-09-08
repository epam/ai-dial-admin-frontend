export interface SchemeParameterControl {
  label: string;
  id: string;
  type?: string;
  itemsTypes?: string[];
  types?: SchemeTypeDefinition[];
  optional: boolean;
  nullable: boolean;
}

export interface SchemeTypeDefinition {
  type?: string;
  isArray: boolean;
  isMultiple: boolean;
}
