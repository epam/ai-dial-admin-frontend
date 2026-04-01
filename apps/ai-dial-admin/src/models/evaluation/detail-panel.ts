export interface ParsedValue {
  displayText: string;
  rawText: string;
  typeChip?: string;
  isLong: boolean;
}

export interface InfoEntry {
  metricKey: string;
  entryKey: string;
  value: string;
}
