import { FC } from 'react';

import classNames from 'classnames';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import FolderInfo from '@/src/components/FoldersStorage/FolderInfo';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  isLoading: boolean;
  modalState: PopUpState;
  dataTestId: string;
  onClose: () => void;
}

const RulesStructure: FC<Props> = ({ isLoading, modalState, dataTestId, onClose }) => {
  const t = useI18n();

  const containerClassName = classNames('lg:max-w-[75%] md:max-w-[90%] h-[584px]');
  return (
    <Popup
      onClose={onClose}
      heading={t(FoldersI18nKey.ReviewStructure)}
      portalId="RulesStructure"
      state={modalState}
      containerClassName={containerClassName}
      dataTestId={dataTestId}
    >
      {isLoading ? (
        <Loader size={50} />
      ) : (
        <div className="flex flex-1 flex-row px-6 min-h-0">
          <div className="flex flex-1 gap-4 pt-4 mb-6 min-h-0">
            <div className="w-[360px] rounded border border-primary p-4 flex-shrink-0 flex">
              <FolderList context={useRuleFolder} disableAutoFetch={true} />
            </div>
            <div className="rounded border border-primary p-4 flex-1">
              <FolderInfo isReadonly={true} />
            </div>
          </div>
        </div>
      )}
      <></>
    </Popup>
  );
};

export default RulesStructure;
