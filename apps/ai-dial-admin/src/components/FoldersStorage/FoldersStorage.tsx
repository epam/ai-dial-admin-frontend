'use client';

import { FC } from 'react';
import { DialCollapsibleSidebar, DialIconButton, DialTooltip } from '@epam/ai-dial-ui-kit';

import FolderCollapse from '@/public/images/icons/folder-collapse.svg';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import FolderInfo from './FolderInfo';
interface Props {
  initialPath?: string;
}

const FoldersStorage: FC<Props> = ({ initialPath }) => {
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
        <h1>{t(MenuI18nKey.FoldersStorage)}</h1>
      </div>
      <div className="flex flex-1 gap-4 min-h-0">
        <DialCollapsibleSidebar
          width={480}
          title={t(MenuI18nKey.FoldersStorage)}
          containerClassName="bg-layer-3 border-transparent mr-0"
          iconSize={24}
          additionalButtons={
            <DialTooltip
              triggerClassName="flex items-center"
              tooltip={isCollapseDisable ? '' : t(FoldersI18nKey.CollapseAll)}
              placement="top"
            >
              <DialIconButton
                className={isCollapseDisable ? 'text-controls-disable' : 'hover:text-accent-primary'}
                onClick={collapseFolders}
                icon={<FolderCollapse size={24} />}
                disabled={isCollapseDisable}
              />
            </DialTooltip>
          }
        >
          <FolderList context={useRuleFolder} initialPath={initialPath} />
        </DialCollapsibleSidebar>
        <FolderInfo isReadonly={false} />
      </div>
    </div>
  );
};

export default FoldersStorage;
