'use client';

import { FC } from 'react';

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
  onChangeIsModalOpen: (value: boolean) => void;
  onChangeModalType: (value?: ModalType) => void;
  onChangeIsBulkView: (value: boolean) => void;
  getAssetContext?: () => AssetsFolderContext<DialFile>;
  onExport?: (fileType?: ImportFileType) => void;
}

const BulkButtons: FC<Props> = ({
  route,
  itemsCount,
  getAssetContext,
  onChangeIsModalOpen,
  onChangeModalType,
  onChangeIsBulkView,
  onExport,
}) => {
  const t = useI18n();
  const folderContext = getAssetContext?.();

  const onBulkExport = () => {
    if (isAssetWithVersion(route)) {
      onChangeModalType(ModalType.export);
      onChangeIsModalOpen(true);
    } else {
      onExport?.();
    }
  };

  return (
    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-layer-0 flex flex-row gap-4 items-center">
      <div className="text-secondary">
        {itemsCount} {t(BasicI18nKey.Selected)}
      </div>
      <div className="bg-layer-4 h-5 w-[1px]"></div>
      <DialButton
        variant={ButtonVariant.Secondary}
        label={t(ButtonsI18nKey.Export)}
        iconBefore={<IconFileArrowRight {...BASE_ICON_PROPS} />}
        disabled={!itemsCount}
        onClick={onBulkExport}
      />
      {isAssetWithVersion(route) && (
        <DialButton
          variant={ButtonVariant.Secondary}
          label={t(ButtonsI18nKey.Delete)}
          iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
          disabled={!itemsCount}
          onClick={() => {
            onChangeModalType(ModalType.deleteBulk);
            onChangeIsModalOpen(true);
          }}
        />
      )}
      <CloseButton
        onClose={() => {
          onChangeIsBulkView(false);
          folderContext?.setBulkSelectedData({});
        }}
      />
    </div>
  );
};

export default BulkButtons;
