import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

export interface DeploymentEntityState {
  status?: CONTAINER_STATUS;
  buildStatus?: IMAGE_STATUS;
}
