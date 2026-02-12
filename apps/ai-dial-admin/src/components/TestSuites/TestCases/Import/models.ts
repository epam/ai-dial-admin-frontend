export interface ImportPreview {
  detectedColumns: ColumnMapping[];
  sampleRows: RowMapping[];
  totalRows: number;
  warnings: ValidationWarning[];
}

export interface ColumnMapping {
  fieldName: string;
  headerName: string;
  inferredType: string;
  mappedTo: string;
}

export interface RowMapping {
  enabled: boolean;
  valid: boolean;
  facts: Record<string, string | number>;
  parameters: Record<string, unknown>;
  validationWarnings: RowValidationWarning[];
  testCaseName: string;
}

export interface RowValidationWarning {
  code: string;
  message: string;
  path: string;
  source: string;
}

export interface ValidationWarning {
  columnName: string;
  message: string;
  rowNumber: number;
}
