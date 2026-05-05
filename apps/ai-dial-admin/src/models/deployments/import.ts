import { ValidationError, ValidationState } from '@/src/types/deployments/import';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';

export interface RowImportMeta {
  validationState: ValidationState;
  validationErrors: ValidationError[];
}

export interface ValidationSummary {
  totalFailed: number;
  errorsByTab: Partial<Record<DeploymentExportEntityType, number>>;
}
