import {
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFileExport,
  IconFolderShare,
  IconInfinity,
  IconPencilMinus,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefreshDot,
  IconReload,
  IconReplace,
  IconTrash,
  IconTrashX,
} from '@tabler/icons-react';
import { GridApi, IRowNode } from 'ag-grid-community';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import IconCompare from '@/public/images/icons/difference.svg';

export function getResourceRollbackOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconRefreshDot {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Resource_rollback,
    label: ActionMenuOperationI18nKey.Resource_rollback,
    onClick,
    hidden,
  };
}

export function getDeleteOperation<T>(
  onClick: (entity?: T, index?: number) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
  className?: string,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} className={className} />,
    id: ActionMenuOperationI18nKey.Delete,
    label: ActionMenuOperationI18nKey.Delete,
    onClick,
    hidden,
  };
}

export function getRemoveOperation<T>(
  onClick: (entity?: T, index?: number) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
  className?: string,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} className={className} />,
    id: ActionMenuOperationI18nKey.Remove,
    label: ActionMenuOperationI18nKey.Remove,
    onClick,
    hidden,
  };
}

export function getEditOperation<T>(
  onClick: (entity?: T, index?: number) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Edit,
    label: ActionMenuOperationI18nKey.Edit,
    onClick,
    hidden,
  };
}

export function getResetOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconReload {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Reset_to_default_limits,
    label: ActionMenuOperationI18nKey.Reset_to_default_limits,
    hidden,
    onClick,
  };
}

export function getSetNoLimitsOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconInfinity {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Set_no_limits,
    label: ActionMenuOperationI18nKey.Set_no_limits,
    hidden,
    onClick,
  };
}

export function getDuplicateOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconCopy {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Duplicate,
    label: ActionMenuOperationI18nKey.Duplicate,
    onClick,
  };
}

export function getOpenInNewTabOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
  disabled?: boolean | ((api: GridApi, node: IRowNode) => boolean),
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconExternalLink {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Open_in_new_tab,
    label: ActionMenuOperationI18nKey.Open_in_new_tab,
    onClick,
    hidden,
    disabled,
  };
}

export function getViewDetailsOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <OpenPopup {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.View_details,
    label: ActionMenuOperationI18nKey.View_details,
    onClick,
    hidden,
  };
}

export function getMoveOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconFolderShare {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Move,
    label: ActionMenuOperationI18nKey.Move,
    onClick,
  };
}

export function getDownloadOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconDownload {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Download,
    label: ActionMenuOperationI18nKey.Download,
    onClick,
    hidden,
  };
}

export function getPreviewOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconEye {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Preview,
    label: ActionMenuOperationI18nKey.Preview,
    onClick,
    hidden,
  };
}

export function getCompareChangesOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconReplace {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Compare_changes,
    label: ActionMenuOperationI18nKey.Compare_changes,
    onClick,
  };
}

export function getRunTestSuiteOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Run,
    label: ActionMenuOperationI18nKey.Run,
    onClick,
  };
}

export function getRunOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Run,
    label: ActionMenuOperationI18nKey.Run,
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
    icon: <IconPlayerPause {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Stop,
    label: ActionMenuOperationI18nKey.Stop,
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

export function getTryOutOperation<T>(onClick: (entity?: T) => void): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} className="text-success" />,
    id: ActionMenuOperationI18nKey.Try_out,
    label: ActionMenuOperationI18nKey.Try_out,
    onClick,
  };
}

export function getExportOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconFileExport {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Export,
    label: ActionMenuOperationI18nKey.Export,
    onClick,
    hidden,
  };
}

export function getCompareOperation<T>(
  onClick: (entity?: T) => void,
  hidden?: (api: GridApi, node: IRowNode) => boolean,
): ActionMenuOperationDeclaration<T> {
  return {
    icon: <IconCompare {...BASE_BUTTON_ICON_PROPS} className="mx-1" />,
    id: ActionMenuOperationI18nKey.Compare,
    label: ActionMenuOperationI18nKey.Compare,
    onClick,
    hidden,
  };
}
