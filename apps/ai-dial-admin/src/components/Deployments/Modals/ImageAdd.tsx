import { FC, useState } from 'react';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { Image } from '@/src/models/deployments/images';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { IMAGE_TEMPLATE } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

import ImageFields from '@/src/components/Images/Fields/ImageFields';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (image: Image) => void;
}

const ImageAdd: FC<Props> = ({ isModalOpen, modalTitle, onClose, onApply }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();

  const [image, setImage] = useState<Image>(IMAGE_TEMPLATE as Image);

  return (
    <DialConfirmationPopup
      portalId="AddImageModal"
      header={modalTitle}
      open={isModalOpen}
      onClose={onClose}
      confirmLabel={t(ButtonsI18nKey.Add)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={() => onApply(image)}
      disableConfirmButton={!isValid}
    >
      <div className="flex px-6 py-4">
        <ImageFields image={image} setImage={setImage} isModal={true} />
      </div>
    </DialConfirmationPopup>
  );
};

export default ImageAdd;
