import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import { CONTAINER_TYPE_TO_AUDIT, IMAGE_TYPE_TO_AUDIT, routeAuditResource } from './constants';

export const resolveEntityAuditType = (
  entity: BaseEntity | undefined,
  view: ApplicationRoute,
): ActivityAuditResourceType | undefined => {
  const discriminator = (entity as { $type?: string } | undefined)?.$type;
  if (discriminator) {
    if (view === ApplicationRoute.Images && discriminator in IMAGE_TYPE_TO_AUDIT) {
      return IMAGE_TYPE_TO_AUDIT[discriminator as IMAGE_TYPE];
    }
    if (discriminator in CONTAINER_TYPE_TO_AUDIT) {
      return CONTAINER_TYPE_TO_AUDIT[discriminator as CONTAINER_TYPE];
    }
  }
  return routeAuditResource[view];
};
