import { IconExternalLink, IconFolderShare, IconPencilMinus, IconTrashX } from '@tabler/icons-react';

import AddChildIcon from '@/public/images/icons/add-child.svg';
import AddSiblingIcon from '@/public/images/icons/add-sibling.svg';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperation } from '@/src/types/action-menu-operations';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';

export const getAddSiblingOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <AddSiblingIcon {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperation.Add_sibling,
    onClick,
  };
};

export const getAddChildOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <AddChildIcon {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperation.Add_child,
    onClick,
  };
};

export const getManageFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconExternalLink {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperation.Manage_folder,
    onClick,
  };
};

export const getRenameFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperation.Rename,
    onClick,
  };
};

export const getMoveFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconFolderShare {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperation.Move_to,
    onClick,
  };
};

export const getDeleteFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperation.Delete,
    onClick,
  };
};
