import { IconExternalLink, IconFolderShare, IconPencilMinus, IconTrashX } from '@tabler/icons-react';

import AddChildIcon from '@/public/images/icons/add-child.svg';
import AddSiblingIcon from '@/public/images/icons/add-sibling.svg';
import { FolderOperationDeclaration } from '@/src/components/Common/FolderCreate/models';
import { FolderOperation } from '@/src/components/Common/FolderCreate/types';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

export const getAddSiblingOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <AddSiblingIcon {...BASE_ICON_PROPS} />,
    id: FolderOperation.Add_sibling,
    onClick,
  };
};

export const getAddChildOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <AddChildIcon {...BASE_ICON_PROPS} />,
    id: FolderOperation.Add_child,
    onClick,
  };
};

export const getManageFolderOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <IconExternalLink {...BASE_ICON_PROPS} />,
    id: FolderOperation.Manage_folder,
    onClick,
  };
};

export const getRenameFolderOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <IconPencilMinus {...BASE_ICON_PROPS} />,
    id: FolderOperation.Rename,
    onClick,
  };
};

export const getMoveFolderOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <IconFolderShare {...BASE_ICON_PROPS} />,
    id: FolderOperation.Move_to,
    onClick,
  };
};

export const getDeleteFolderOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <IconTrashX {...BASE_ICON_PROPS} />,
    id: FolderOperation.Delete,
    onClick,
  };
};
