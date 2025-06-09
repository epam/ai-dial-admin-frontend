import { IconTrashX, IconRefreshDot } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useCallback, useState } from 'react';

import ContextMenu, { ContextMenuItem } from '@/src/components/Common/ContextMenu/ContextMenu';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { FileUploadI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  fileUrl: string;
  onChange: (url: string) => void;
}

const FilledIcon: FC<Props> = ({ fileUrl, onChange }) => {
  const t = useI18n();
  const [src, setSrc] = useState(fileUrl);
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  const onClose = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  const contextMenu: ContextMenuItem[] = [
    {
      title: t(FileUploadI18nKey.IconMenuChangeItem),
      onClick: () => setIsModalState(PopUpState.Opened),
      icon: <IconRefreshDot {...BASE_ICON_PROPS} />,
    },
    {
      title: t(FileUploadI18nKey.IconMenuDeleteItem),
      onClick: () => onChange(''),
      icon: <IconTrashX {...BASE_ICON_PROPS} />,
    },
  ];

  return (
    <>
      <ContextMenu contextMenuItems={contextMenu}>
        <div className="bg-controls-enable-primary rounded-full w-[80px] group relative border border-primary hover:border-hover">
          <Image
            src={src}
            alt="entityImage"
            width={80}
            height={80}
            className="rounded-full"
            onError={() => setSrc('/images/icons/fallback-entity-icon.svg')}
          />
          <div className="absolute inset-0 bg-accent-primary-alpha rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-200 pointer-events-none" />
        </div>
      </ContextMenu>
      <IconGalleryModal modalState={modalState} selectedValue={fileUrl} onClose={onClose} onChange={onChange} />
    </>
  );
};

export default FilledIcon;
