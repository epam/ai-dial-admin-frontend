'use client';

import { Dispatch, SetStateAction } from 'react';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconFileArrowRight, IconTrashX } from '@tabler/icons-react';

import CloseButton from '@/src/components/Common/CloseButton/CloseButton';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { ModalType } from './Modals';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';

interface Props {
  route: ApplicationRoute;
  itemsCount: number;
  context?: () => AssetsFolderContext<DialFile>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setModalType: Dispatch<SetStateAction<ModalType | undefined>>;
  setIsBulkView: Dispatch<SetStateAction<boolean>>;
  handleExport?: (fileType?: ImportFileType) => void;
}

const BulkButtons = ({
  route,
  itemsCount,
  context,
  setIsModalOpen,
  setModalType,
  setIsBulkView,
  handleExport,
}: Props) => {
  const t = useI18n();
  const folderContext = context?.();

  const bulkExport = () => {
    if (isAssetWithVersion(route)) {
      setModalType(ModalType.export);
      setIsModalOpen(true);
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
      {route !== ApplicationRoute.AssetsToolsets && (
        <DialButton
          variant={ButtonVariant.Secondary}
          label={t(ButtonsI18nKey.Export)}
          iconBefore={<IconFileArrowRight {...BASE_ICON_PROPS} />}
          disabled={!itemsCount}
          onClick={bulkExport}
        />
      )}
      {isAssetWithVersion(route) && (
        <DialButton
          variant={ButtonVariant.Secondary}
          label={t(ButtonsI18nKey.Delete)}
          iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
          disabled={!itemsCount}
          onClick={() => {
            setModalType(ModalType.deleteBulk);
            setIsModalOpen(true);
          }}
        />
      )}
      <CloseButton
        onClose={() => {
          setIsBulkView(false);
          folderContext?.setBulkSelectedData({});
        }}
      />
    </div>
  );
};

export default BulkButtons;
