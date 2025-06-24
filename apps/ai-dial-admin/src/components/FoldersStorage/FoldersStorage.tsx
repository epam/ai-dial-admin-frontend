'use client';

import { FC } from 'react';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import FolderInfo from './FolderInfo';

interface Props {
  initialPath?: string;
}

const FoldersStorage: FC<Props> = ({ initialPath }) => {
  const t = useI18n() as (t: string) => string;

  return (
    <div className="flex flex-col bg-layer-2 rounded p-4 flex-1 min-h-0">
      <h1>{t(MenuI18nKey.FoldersStorage)}</h1>
      <div className="flex flex-1 gap-4 pt-4 min-h-0">
        <div className="w-[480px] bg-layer-3 rounded p-4 flex-shrink-0 flex">
          <FolderList context={useRuleFolder} initialPath={initialPath} />
        </div>
        <FolderInfo isReadonly={false} />
      </div>
    </div>
  );
};

export default FoldersStorage;
