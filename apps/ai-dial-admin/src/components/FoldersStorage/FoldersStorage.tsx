'use client';

import { FC } from 'react';
import { CollapsibleSidebar, IconButton, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';

import FolderCollapse from '@/public/images/icons/folder-collapse.svg';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import FolderInfo from './FolderInfo';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
interface Props {
  initialPath?: string;
}

const FoldersStorage: FC<Props> = ({ initialPath }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const t = useI18n();
  const folderContext = useRuleFolder();
  const isCollapseDisable =
    folderContext?.expandedFolders.size === 0 ||
    (folderContext?.expandedFolders.size === 1 && folderContext?.expandedFolders.has(`${ROOT_FOLDER}/`));

  const collapseFolders = () => {
    folderContext?.toggleFolder({ path: `${ROOT_FOLDER}/` } as DialFile, true, true);
  };
  return (
    <div className="flex flex-col bg-layer-2 rounded py-4 px-6 flex-1 min-h-0">
      <div className="flex flex-row flex-wrap justify-between mb-4 items-center h-[40px]">
        <h1 className="dial-h1-text">{t(MenuI18nKey.FoldersStorage)}</h1>
      </div>
      <div className="flex flex-1 gap-4 min-h-0">
        <CollapsibleSidebar
          width={480}
          title={t(MenuI18nKey.FoldersStorage)}
          className="bg-layer-3 border-transparent mr-0"
          additionalButtons={
            <Tooltip
              triggerClassName="flex items-center"
              tooltip={isCollapseDisable ? '' : t(FoldersI18nKey.CollapseAll)}
              placement={TooltipPlacement.Top}
            >
              <IconButton
                className={isCollapseDisable ? 'text-controls-disable' : 'hover:text-accent-primary'}
                onClick={collapseFolders}
                icon={<FolderCollapse size={24} />}
                disabled={isCollapseDisable}
              />
            </Tooltip>
          }
        >
          <FolderList context={useRuleFolder} initialPath={initialPath} />
        </CollapsibleSidebar>
        <FolderInfo isReadonly={isReadOnlyAdmin} />
      </div>
    </div>
  );
};

export default FoldersStorage;
