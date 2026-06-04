import { DialDropdown } from '@epam/ai-dial-ui-kit';
import { IconRefreshDot, IconTrashX } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { getIconPath } from '@/src/utils/themes/icon-path';

interface Props {
  disabled?: boolean;
  fileUrl: string;
  onChange: (url: string) => void;
}

const FilledIcon: FC<Props> = ({ disabled, fileUrl, onChange }) => {
  const t = useI18n();
  const [src, setSrc] = useState(fileUrl);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setSrc(fileUrl);
  }, [fileUrl]);

  const onClose = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const items = useMemo(
    () => [
      {
        key: 'change-icon',
        label: t(EntitiesI18nKey.ChangeIcon),
        onClick: () => setIsModalOpen(true),
        icon: <IconRefreshDot {...BASE_BUTTON_ICON_PROPS} />,
      },
      {
        key: 'remove-icon',
        label: t(ButtonsI18nKey.Delete),
        onClick: () => onChange(''),
        icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} />,
      },
    ],
    [onChange, t],
  );

  const getImageSrc = () => {
    return (
      <div className="bg-controls-enable-primary rounded-full w-[80px] group relative border border-primary hover:border-hover">
        <Image
          role="icon"
          src={getIconPath(src)}
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

  return disabled ? (
    getImageSrc()
  ) : (
    <>
      <DialDropdown items={items} className="w-[180px]">
        {getImageSrc()}
      </DialDropdown>

      <IconGalleryModal isModalOpen={isModalOpen} selectedValue={fileUrl} onClose={onClose} onChange={onChange} />
    </>
  );
};

export default FilledIcon;
