import { IconTrashX, IconRefreshDot } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useCallback, useEffect, useState } from 'react';

import ContextMenu, { ContextMenuItem } from '@/src/components/Common/ContextMenu/ContextMenu';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  readonly?: boolean;
  fileUrl: string;
  onChange: (url: string) => void;
}

const FilledIcon: FC<Props> = ({ readonly, fileUrl, onChange }) => {
  const t = useI18n();
  const [src, setSrc] = useState(fileUrl);
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  useEffect(() => {
    setSrc(fileUrl);
  }, [fileUrl]);

  const onClose = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  const contextMenu: ContextMenuItem[] = [
    {
      title: t(EntitiesI18nKey.ChangeIcon),
      onClick: () => setIsModalState(PopUpState.Opened),
      icon: <IconRefreshDot {...BASE_ICON_PROPS} />,
    },
    {
      title: t(ButtonsI18nKey.Delete),
      onClick: () => onChange(''),
      icon: <IconTrashX {...BASE_ICON_PROPS} />,
    },
  ];

  const getImageSrc = () => {
    return (
      <div className="bg-controls-enable-primary rounded-full w-[80px] group relative border border-primary hover:border-hover">
        <Image
          role="icon"
          src={src}
          alt="entityImage"
          width={80}
          height={80}
          className="rounded-full"
          onError={() => setSrc('/images/icons/fallback-entity-icon.svg')}
        />
        <div className="absolute inset-0 bg-accent-primary-alpha rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-200 pointer-events-none" />
      </div>
    );
  };

  return readonly ? (
    getImageSrc()
  ) : (
    <>
      <ContextMenu contextMenuItems={contextMenu}>{getImageSrc()}</ContextMenu>
      <IconGalleryModal modalState={modalState} selectedValue={fileUrl} onClose={onClose} onChange={onChange} />
    </>
  );
};

export default FilledIcon;
