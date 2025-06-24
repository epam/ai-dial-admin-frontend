import {
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFolderShare,
  IconInfinity,
  IconRefresh,
  IconTrash,
  IconTrashX,
} from '@tabler/icons-react';
import { GridApi, IRowNode } from 'ag-grid-community';

import Reset from '@/public/images/icons/reset.svg';
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

export function getDeleteOperation<T>(onClick: (entity: T) => void): EntityOperationDeclaration<T> {
  return {
    icon: <IconTrashX {...BASE_ICON_PROPS} />,
    id: EntityOperation.Delete,
    onClick,
  };
}

export function getRemoveOperation<T>(onClick: (entity: T) => void): EntityOperationDeclaration<T> {
  return {
    icon: <IconTrash {...BASE_ICON_PROPS} />,
    id: EntityOperation.Remove,
    onClick,
  };
}

export function getResetOperation<T>(
  onClick: (entity: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): EntityOperationDeclaration<T> {
  return {
    icon: <Reset />,
    id: EntityOperation.Reset_to_default_limits,
    hidden,
    onClick,
  };
}

export function getSetNoLimitsOperation<T>(
  onClick: (entity: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): EntityOperationDeclaration<T> {
  return {
    icon: <IconInfinity {...BASE_ICON_PROPS} />,
    id: EntityOperation.Set_no_limits,
    hidden,
    onClick,
  };
}

export function getDuplicateOperation<T>(onClick: (entity: T) => void): EntityOperationDeclaration<T> {
  return {
    icon: <IconCopy {...BASE_ICON_PROPS} />,
    id: EntityOperation.Duplicate,
    onClick,
  };
}

export function getOpenInNewTabOperation<T>(
  onClick: (entity: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): EntityOperationDeclaration<T> {
  return {
    icon: <IconExternalLink {...BASE_ICON_PROPS} />,
    id: EntityOperation.Open_in_new_tab,
    onClick,
    hidden,
  };
}

export function getMoveOperation<T>(onClick: (entity: T) => void): EntityOperationDeclaration<T> {
  return {
    icon: <IconFolderShare {...BASE_ICON_PROPS} />,
    id: EntityOperation.Move,
    onClick,
  };
}

export function getDownloadOperation<T>(onClick: (entity: T) => void): EntityOperationDeclaration<T> {
  return {
    icon: <IconDownload {...BASE_ICON_PROPS} />,
    id: EntityOperation.Download,
    onClick,
  };
}

export function getPreviewOperation<T>(
  onClick: (entity: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): EntityOperationDeclaration<T> {
  return {
    icon: <IconEye {...BASE_ICON_PROPS} />,
    id: EntityOperation.Preview,
    onClick,
    hidden,
  };
}
