import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';

export const getContainersForEntitiesGrid = (
  containers: Container[] | null | undefined,
  entityType: string,
): EntitiesGridData[] => {
  return [...(containers || [])].map((container) => ({
    ...container,
    type: entityType,
  }));
};

export const getImagesForEntitiesGrid = (images: Image[] | null | undefined): EntitiesGridData[] => {
  return [...(images || [])].map((image) => ({
    ...image,
    name: image.name,
    type: DeploymentExportEntityType.IMAGE,
  }));
};
