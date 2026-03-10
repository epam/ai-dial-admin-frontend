import { FC } from 'react';

import { DialLoader, DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import FolderInfo from '@/src/components/FoldersStorage/FolderInfo';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const RulesStructure: FC<Props> = ({ isLoading, isOpen, onClose }) => {
  const t = useI18n();

  return (
    <DialPopup
      onClose={onClose}
      header={t(FoldersI18nKey.ReviewStructure)}
      portalId="RulesStructure"
      open={isOpen}
      className="min-h-[200px]"
      size={PopupSize.Lg}
    >
      {isLoading ? (
        <DialLoader size={50} />
      ) : (
        <div className="flex flex-1 flex-row px-6 min-h-0">
          <div className="flex flex-1 gap-4 pt-4 mb-6 min-h-0">
            <div className="w-[360px] rounded border border-primary p-4 shrink-0 flex">
              <FolderList context={useRuleFolder} disableAutoFetch={true} />
            </div>
            <div className="rounded border border-primary p-4 flex-1">
              <FolderInfo isReadonly={true} />
            </div>
          </div>
        </div>
      )}
    </DialPopup>
  );
};

export default RulesStructure;
