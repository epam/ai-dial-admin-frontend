'use client';
import { DialInputPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import Field from '@/src/components/Common/Field/Field';
import FilledIcon from '@/src/components/Common/IconFile/FilledIcon';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  iconUrl?: string;
  disabled?: boolean;
  onChange?: (iconUrl: string) => void;
}

const IconControl: FC<Props> = ({ iconUrl, disabled = true, onChange }) => {
  const t = useI18n();
  const { themeUrl } = useAppContext();
  const value = useMemo(
    () => (iconUrl ? (iconUrl.startsWith('https://') ? iconUrl : `${themeUrl}/${iconUrl}`) : ''),
    [iconUrl, themeUrl],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  return (
    <div className="flex flex-col md:max-w-[180px]">
      <Field fieldTitle={t(EntityFieldsI18nKey.iconUrl)} htmlFor="icon" />
      {value.length === 0 ? (
        <DialInputPopup
          emptyValueText={t(BasicI18nKey.None)}
          open={isModalOpen}
          selectedValue={value}
          onOpen={onOpenModal}
        >
          <IconGalleryModal
            isModalOpen={isModalOpen}
            selectedValue={value}
            onClose={onCloseModal}
            onChange={(url) => onChange?.(url)}
          />
        </DialInputPopup>
      ) : (
        <FilledIcon fileUrl={value} onChange={(url) => onChange?.(url)} disabled={disabled} />
      )}
    </div>
  );
};

export default IconControl;
