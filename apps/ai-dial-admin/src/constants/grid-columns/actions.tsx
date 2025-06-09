import { IconRefresh } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { EntityOperationDeclaration } from '@/src/models/entity-operations';
import { EntityOperation } from '@/src/types/entity-operations';

export function getResourceRollbackOperation<T>(onClick: (entity: T) => void): EntityOperationDeclaration<T> {
  return {
    icon: <IconRefresh {...BASE_ICON_PROPS} />,
    id: EntityOperation.Resource_rollback,
    onClick,
  };
}
