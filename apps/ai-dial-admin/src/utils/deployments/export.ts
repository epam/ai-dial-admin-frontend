import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { DeploymentExportComponentType, DeploymentExportEntityType } from '@/src/types/deployments/export';

const CONTAINER_TYPE_TO_EXPORT: Record<string, DeploymentExportComponentType> = {
  [CONTAINER_TYPE.MCP]: DeploymentExportComponentType.MCP_DEPLOYMENT,
  [CONTAINER_TYPE.INTERCEPTOR]: DeploymentExportComponentType.INTERCEPTOR_DEPLOYMENT,
  [CONTAINER_TYPE.ADAPTER]: DeploymentExportComponentType.ADAPTER_DEPLOYMENT,
  [CONTAINER_TYPE.APPLICATION]: DeploymentExportComponentType.APPLICATION_DEPLOYMENT,
  [CONTAINER_TYPE.NIM]: DeploymentExportComponentType.NIM_DEPLOYMENT,
  [CONTAINER_TYPE.HF]: DeploymentExportComponentType.INFERENCE_DEPLOYMENT,
};

const IMAGE_TYPE_TO_EXPORT: Record<string, DeploymentExportComponentType> = {
  [IMAGE_TYPE.MCP]: DeploymentExportComponentType.MCP_IMAGE_DEFINITION,
  [IMAGE_TYPE.ADAPTER]: DeploymentExportComponentType.ADAPTER_IMAGE_DEFINITION,
  [IMAGE_TYPE.APPLICATION]: DeploymentExportComponentType.APPLICATION_IMAGE_DEFINITION,
  [IMAGE_TYPE.INTERCEPTOR]: DeploymentExportComponentType.INTERCEPTOR_IMAGE_DEFINITION,
};

export const getDeploymentExportComponentType = (
  entityType: string,
  subType: string,
): DeploymentExportComponentType => {
  if (entityType === DeploymentExportEntityType.IMAGE) {
    return IMAGE_TYPE_TO_EXPORT[subType] || DeploymentExportComponentType.MCP_IMAGE_DEFINITION;
  }
  return CONTAINER_TYPE_TO_EXPORT[subType] || DeploymentExportComponentType.MCP_DEPLOYMENT;
};
