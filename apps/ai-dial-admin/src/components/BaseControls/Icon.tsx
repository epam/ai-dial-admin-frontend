'use client';
import { DialInputPopup, DialLabel } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import FilledIcon from '@/src/components/Common/IconFile/FilledIcon';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  iconUrl?: string;
  disabled?: boolean;
  onChange?: (iconUrl: string) => void;
}

const IconControl: FC<Props> = ({ iconUrl, disabled = false, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  return (
    <div className="flex flex-col gap-y-2">
      <DialLabel label={t(EntityFieldsI18nKey.iconUrl)} htmlFor="icon" />
      {!iconUrl ? (
        <DialInputPopup
          emptyValueText={t(BasicI18nKey.None)}
          open={isModalOpen}
          selectedValue={iconUrl}
          onOpen={onOpenModal}
          disabled={isDisabled}
          inputClassName={STANDARD_CONTROL_WIDTH}
        >
          <IconGalleryModal
            isModalOpen={isModalOpen}
            selectedValue={iconUrl || ''}
            onClose={onCloseModal}
            onChange={(url) => onChange?.(url)}
          />
        </DialInputPopup>
      ) : (
        <FilledIcon fileUrl={iconUrl} onChange={(url) => onChange?.(url)} disabled={isDisabled} />
      )}
    </div>
  );
};

export default IconControl;
