'use client';

import { Dispatch, SetStateAction } from 'react';

import { IconFileArrowRight, IconTrashX, IconX } from '@tabler/icons-react';

import Button from '@/src/components/Common/Button/Button';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { ModalType } from './Modals';
import { ImportFileType } from '@/src/types/import';

interface Props {
  route: ApplicationRoute;
  itemsCount: number;
  context?: () => PromptFolderContextType | FileFolderContextType;
  setModalState: Dispatch<SetStateAction<PopUpState>>;
  setModalType: Dispatch<SetStateAction<ModalType | undefined>>;
  setIsBulkView: Dispatch<SetStateAction<boolean>>;
  handleExport?: (fileType?: ImportFileType) => void;
}

const BulkButtons = ({
  route,
  itemsCount,
  context,
  setModalState,
  setModalType,
  setIsBulkView,
  handleExport,
}: Props) => {
  const t = useI18n();
  const folderContext = context?.();

  const bulkExport = () => {
    if (route === ApplicationRoute.Prompts) {
      setModalType(ModalType.export);
      setModalState(PopUpState.Opened);
    } else {
      handleExport?.();
    }
  };

  return (
    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-layer-0 flex flex-row gap-4 items-center">
      <div className="text-secondary">
        {itemsCount} {t(BasicI18nKey.Selected)}
      </div>
      <div className="bg-layer-4 h-5 w-[1px]"></div>
      <Button
        cssClass="secondary"
        title={t(ButtonsI18nKey.Export)}
        iconBefore={<IconFileArrowRight {...BASE_ICON_PROPS} />}
        disable={!itemsCount}
        onClick={bulkExport}
      />
      {route === ApplicationRoute.Prompts && (
        <Button
          cssClass="secondary"
          title={t(ButtonsI18nKey.Delete)}
          iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
          disable={!itemsCount}
          onClick={() => {
            setModalType(ModalType.deleteBulk);
            setModalState(PopUpState.Opened);
          }}
        />
      )}
      <Button
        cssClass="text-secondary hover:text-accent-primary"
        onClick={() => {
          setIsBulkView(false);
          folderContext?.setBulkSelectedData({});
        }}
        iconBefore={<IconX height={24} width={24} />}
      />
    </div>
  );
};

export default BulkButtons;
