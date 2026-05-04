import { FileComponentItem } from '@/src/models/import';
import { ValidationError } from '@/src/types/deployments/import';

export interface ExportComponentInfo {
  id: string;
  displayName: string | null;
  version: string | null;
  description: string | null;
  type: string;
}

export interface DeploymentExportPreviewResponse {
  globalImageBuildDomainWhitelist: string[];
  imageDefinitions: ExportComponentInfo[];
  deployments: ExportComponentInfo[];
}

export interface DeploymentImportPreviewResponse {
  mcpDeployments: FileComponentItem[];
  adapterDeployments: FileComponentItem[];
  applicationDeployments: FileComponentItem[];
  interceptorDeployments: FileComponentItem[];
  nimDeployments: FileComponentItem[];
  inferenceDeployments: FileComponentItem[];
  mcpImageDefinitions: FileComponentItem[];
  adapterImageDefinitions: FileComponentItem[];
  applicationImageDefinitions: FileComponentItem[];
  interceptorImageDefinitions: FileComponentItem[];
  globalImageBuildDomainWhitelist: FileComponentItem | null;
  validationErrors?: ValidationError[];
}
