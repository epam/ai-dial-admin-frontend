import { ValidationWarning } from '@/src/models/evaluation/test-suite';

export interface ImportPreview {
  autoDetectedSchema: AutoDetectedSchema[];
  detectedColumns: ColumnMapping[];
  sampleRows: RowMapping[];
  totalRows: number;
  warnings: CaseWarning[];
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
  validationWarnings: ValidationWarning[];
  testCaseName: string;
  /** Reserved top-level conversation-grouping columns, parsed by the backend from the CSV (not into `data`). */
  conversationId?: string | null;
  turnIndex?: number | null;
}

export interface CaseWarning {
  columnName: string;
  message: string;
  rowNumber: number;
}
