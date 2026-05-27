import { TestCaseSchema, ValidationWarning } from '@/src/models/evaluation/test-suite';
import { DatasetVisibility, RevalidationStatus } from '@/src/types/evaluation';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  testCaseSchema: TestCaseSchema[];
  visibility: DatasetVisibility;
  createdBy?: string;
  valid: boolean;
  validationWarnings?: ValidationWarning[];
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface DatasetRequest {
  name: string;
  description?: string;
  testCaseSchema: TestCaseSchema[];
  createdBy?: string;
  visibility?: DatasetVisibility;
  bindToSuiteId?: string;
}

export interface DatasetVisibilityTransition {
  visibility: DatasetVisibility;
}

export interface DatasetReference {
  id: string;
  version: number;
  name: string;
}

export interface RevalidationTask {
  taskId: string;
  datasetId: string;
  status: RevalidationStatus;
  totalCases: number;
  processedCases: number;
  validCount: number;
  invalidCount: number;
  startedAt: number;
  completedAt: number | null;
  errorMessage?: string;
  coercedCellCount: number;
}

export interface FileMetadata {
  path: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface CsvImportResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warnings?: ValidationWarning[];
  skippedCount?: number;
  overriddenCount?: number;
}
