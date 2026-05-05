import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { ExportConfigComponentType } from '@/src/types/deployments/import';

export const GLOBAL_FIREWALL_TAB_ID = 'GLOBAL_FIREWALL';

export const DEPLOYMENT_RESPONSE_KEYS: Record<string, ExportConfigComponentType> = {
  mcpDeployments: ExportConfigComponentType.MCP_DEPLOYMENT,
  adapterDeployments: ExportConfigComponentType.ADAPTER_DEPLOYMENT,
  applicationDeployments: ExportConfigComponentType.APPLICATION_DEPLOYMENT,
  interceptorDeployments: ExportConfigComponentType.INTERCEPTOR_DEPLOYMENT,
  nimDeployments: ExportConfigComponentType.NIM_DEPLOYMENT,
  inferenceDeployments: ExportConfigComponentType.INFERENCE_DEPLOYMENT,
  mcpImageDefinitions: ExportConfigComponentType.MCP_IMAGE_DEFINITION,
  adapterImageDefinitions: ExportConfigComponentType.ADAPTER_IMAGE_DEFINITION,
  applicationImageDefinitions: ExportConfigComponentType.APPLICATION_IMAGE_DEFINITION,
  interceptorImageDefinitions: ExportConfigComponentType.INTERCEPTOR_IMAGE_DEFINITION,
};

export const COMPONENT_TYPE_TO_TAB_ID: Partial<Record<ExportConfigComponentType, DeploymentExportEntityType>> = {
  [ExportConfigComponentType.MCP_DEPLOYMENT]: DeploymentExportEntityType.MCP_CONTAINER,
  [ExportConfigComponentType.ADAPTER_DEPLOYMENT]: DeploymentExportEntityType.ADAPTER_CONTAINER,
  [ExportConfigComponentType.APPLICATION_DEPLOYMENT]: DeploymentExportEntityType.APPLICATION_CONTAINER,
  [ExportConfigComponentType.INTERCEPTOR_DEPLOYMENT]: DeploymentExportEntityType.INTERCEPTOR_CONTAINER,
  [ExportConfigComponentType.NIM_DEPLOYMENT]: DeploymentExportEntityType.MODEL_SERVING,
  [ExportConfigComponentType.INFERENCE_DEPLOYMENT]: DeploymentExportEntityType.MODEL_SERVING,
  [ExportConfigComponentType.MCP_IMAGE_DEFINITION]: DeploymentExportEntityType.IMAGE,
  [ExportConfigComponentType.ADAPTER_IMAGE_DEFINITION]: DeploymentExportEntityType.IMAGE,
  [ExportConfigComponentType.APPLICATION_IMAGE_DEFINITION]: DeploymentExportEntityType.IMAGE,
  [ExportConfigComponentType.INTERCEPTOR_IMAGE_DEFINITION]: DeploymentExportEntityType.IMAGE,
};
