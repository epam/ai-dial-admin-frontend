import { FC } from 'react';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';

interface Props {
  isModalOpen: boolean;
  title: string;
  onClose: () => void;
  onApply: (image: Image) => void;
  image: Image;
}

const ImageInstall: FC<Props> = ({ isModalOpen, title, onClose, onApply, image }) => {
  const t = useI18n();

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={title}
      portalId="BuildImageModal"
      open={isModalOpen}
      className="md:max-w-[400px] lg:max-w-[400px]"
      confirmLabel={t(ButtonsI18nKey.Install)}
      onConfirm={() => {
        onApply(image);
        onClose();
      }}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-2">
        <p className="text-secondary small-150">{t(ImagesI18nKey.InstallModalDescription)}</p>
        <p className="text-secondary small-150">
          {t(EntityFieldsI18nKey.version)}:<span className="text-primary ml-1">{image.version}</span>
        </p>
      </div>
    </DialConfirmationPopup>
  );
};

export default ImageInstall;
