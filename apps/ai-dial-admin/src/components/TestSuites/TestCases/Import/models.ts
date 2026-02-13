export interface ImportPreview {
  autoDetectedSchema: AutoDetectedSchema[];
  detectedColumns: ColumnMapping[];
  sampleRows: RowMapping[];
  totalRows: number;
  warnings: ValidationWarning[];
}

export interface AutoDetectedSchema {
  name: string;
  type: string;
  required: boolean;
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
  data: Record<string, string | number>;
  validationWarnings: RowValidationWarning[];
  testCaseName: string;
}

export interface RowValidationWarning {
  code: string;
  message: string;
  path: string;
  fieldName: string;
}

export interface ValidationWarning {
  columnName: string;
  message: string;
  rowNumber: number;
}
