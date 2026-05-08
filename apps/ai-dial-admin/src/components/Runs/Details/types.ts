export interface ArrayItemViewModel {
  index: number;
  compactText: string;
  prettyText: string;
  isItemLong: boolean;
  isStructured: boolean;
}

export interface StructuredObjectValue {
  displayText: string;
  rawText: string;
  isLong: boolean;
  typeChip: 'Object';
}
