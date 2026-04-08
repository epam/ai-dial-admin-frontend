import { IconExternalLink, IconFolderShare, IconPencilMinus, IconTrashX } from '@tabler/icons-react';

import AddChildIcon from '@/public/images/icons/add-child.svg';
import AddSiblingIcon from '@/public/images/icons/add-sibling.svg';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';

export const getAddSiblingOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <AddSiblingIcon {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Add_sibling,
    label: ActionMenuOperationI18nKey.Add_sibling,
    onClick,
  };
};

export const getAddChildOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <AddChildIcon {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Add_child,
    label: ActionMenuOperationI18nKey.Add_child,
    onClick,
  };
};

export const getManageFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconExternalLink {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Manage_folder,
    label: ActionMenuOperationI18nKey.Manage_folder,
    onClick,
  };
};

export const getRenameFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Rename,
    label: ActionMenuOperationI18nKey.Rename,
    onClick,
  };
};

export const getMoveFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconFolderShare {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Move_to,
    label: ActionMenuOperationI18nKey.Move_to,
    onClick,
  };
};

export const getDeleteFolderOperation = <T extends object>(onClick: () => void): ActionMenuOperationDeclaration<T> => {
  return {
    icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} />,
    id: ActionMenuOperationI18nKey.Delete,
    label: ActionMenuOperationI18nKey.Delete,
    onClick,
  };
};
