import {
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFolderShare,
  IconInfinity,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconReload,
  IconReplace,
  IconTrash,
  IconTrashX,
} from '@tabler/icons-react';
import { GridApi, IRowNode } from 'ag-grid-community';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { ActionMenuOperation } from '@/src/types/action-menu-operations';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';

export function getResourceRollbackOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconRefresh {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Resource_rollback,
    onClick,
  };
}

export function getDeleteOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconTrashX {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Delete,
    onClick,
  };
}

export function getRemoveOperation<T>(
  onClick: (entity?: T, index?: number) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconTrash {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Remove,
    onClick,
    hidden,
  };
}

export function getResetOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconReload {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Reset_to_default_limits,
    hidden,
    onClick,
  };
}

export function getSetNoLimitsOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconInfinity {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Set_no_limits,
    hidden,
    onClick,
  };
}

export function getDuplicateOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconCopy {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Duplicate,
    onClick,
  };
}

export function getOpenInNewTabOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconExternalLink {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Open_in_new_tab,
    onClick,
    hidden,
  };
}

export function getViewDetailsOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <OpenPopup {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.View_details,
    onClick,
    hidden,
  };
}

export function getMoveOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconFolderShare {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Move,
    onClick,
  };
}

export function getDownloadOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconDownload {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Download,
    onClick,
  };
}

export function getPreviewOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconEye {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Preview,
    onClick,
    hidden,
  };
}

export function getCompareChangesOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconReplace {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Compare_changes,
    onClick,
  };
}
/*
export function getDeleteOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconTrashX {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Delete,
    onClick,
  };
}*/

export function getDeployOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconPlayerPlay {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Run,
    onClick,
    hidden: (_: GridApi, node: IRowNode) => {
      return (
        node.data.status === CONTAINER_STATUS.RUNNING ||
        node.data.status === CONTAINER_STATUS.PENDING ||
        node.data.status === CONTAINER_STATUS.FAILED
      );
    },
  };
}

export function getStopOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconPlayerPause {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Stop,
    onClick,
    hidden: (_: GridApi, node: IRowNode) => {
      return (
        node.data.status !== CONTAINER_STATUS.RUNNING &&
        node.data.status !== CONTAINER_STATUS.PENDING &&
        node.data.status !== CONTAINER_STATUS.FAILED
      );
    },
  };
}

/*export function getDuplicateOperation<T>(onClick: (entity: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconCopy {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Duplicate,
    onClick,
  };
}

export function getOpenInNewTabOperation<T>(
  onClick: (entity: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconExternalLink {...BASE_ICON_PROPS} />,
    id: ActionMenuOperation.Open_in_new_tab,
    onClick,
    hidden,
  };
}*/
