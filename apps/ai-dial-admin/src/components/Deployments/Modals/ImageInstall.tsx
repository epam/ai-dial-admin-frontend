import { FC } from 'react';
import { ConfirmationPopup } from '@epam/ai-dial-ui-kit';

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
    <ConfirmationPopup
      portalId="ImageInstallModal"
      onClose={onClose}
      header={title}
      open={isModalOpen}
      confirmLabel={t(ButtonsI18nKey.Install)}
      onConfirm={() => {
        onApply(image);
        onClose();
      }}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-2">
        <p className="text-secondary dial-small-paragraph-text">{t(ImagesI18nKey.InstallModalDescription)}</p>
        <p className="text-secondary dial-small-paragraph-text">
          {t(EntityFieldsI18nKey.version)}:<span className="text-primary ml-1">{image.version}</span>
        </p>
      </div>
    </ConfirmationPopup>
  );
};

export default ImageInstall;
