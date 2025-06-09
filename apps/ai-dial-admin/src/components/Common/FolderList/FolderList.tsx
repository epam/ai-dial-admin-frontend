import { IconCaretDownFilled, IconCaretRightFilled, IconFolder } from '@tabler/icons-react';
import { FC, useEffect } from 'react';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { isFolder } from '@/src/utils/files/path';
import classNames from 'classnames';

interface Props {
  disableAutoFetch?: boolean;
  context?: () => PromptFolderContextType | FileFolderContextType | RuleFolderContextType;
}

const FolderList: FC<Props> = ({ context, disableAutoFetch }) => {
  const t = useI18n();
  const folderContext = context?.();

  useEffect(() => {
    if (!disableAutoFetch && (folderContext?.files == null || folderContext?.files?.length === 0)) {
      folderContext?.fetchFiles(`${ROOT_FOLDER}/`);
    }
  }, [folderContext, disableAutoFetch]);

  const getFolderClassNames = (node: DialFile, level: number) => {
    const isSelected = folderContext?.filePath === node.path;
    const baseClass = `flex py-2 pl-${level * 5}`;
    const selectedClass = isSelected
      ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary rounded'
      : 'border-l-2 border-l-transparent';
    const iconClass =
      !node.children?.some((c) => isFolder(c.nodeType)) && folderContext?.fetchedFoldersData[node.path]
        ? 'text-transparent'
        : '';

    return {
      baseClass,
      selectedClass,
      iconClass,
    };
  };

  const renderTree = (nodes: DialFile[], level: number) => {
    return nodes?.map((node) => {
      const { path, nodeType, children, name } = node;
      const { baseClass, selectedClass, iconClass } = getFolderClassNames(node, level);

      return (
        <div key={path} className="small-medium cursor-pointer text-secondary">
          {isFolder(nodeType) && (
            <div onClick={() => folderContext?.toggleFolder(node)} className={`${baseClass} ${selectedClass}`}>
              <div className={classNames(iconClass, 'flex items-center justify-center')}>
                {folderContext?.expandedFolders.has(path) ? (
                  <IconCaretDownFilled {...BASE_ICON_PROPS} widths={10} height={10} />
                ) : (
                  <IconCaretRightFilled {...BASE_ICON_PROPS} widths={10} height={10} />
                )}
              </div>
              <IconFolder {...BASE_ICON_PROPS} />
              <span className="pl-2 text-primary">{name}</span>
            </div>
          )}
          {folderContext?.expandedFolders.has(path) && children && (
            <div key={`${path}-children`}>{renderTree(children, level + 1)}</div>
          )}
        </div>
      );
    });
  };
  return (
    <div className="flex-1 w-full overflow-y-auto" data-testid={'folder-list'}>
      {!folderContext?.files?.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        renderTree(folderContext?.files, 0)
      )}
    </div>
  );
};

export default FolderList;
