import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { getImageTemplate, validateImage } from '@/src/utils/deployments/images';
import { FieldError } from '@/src/models/error';
import ImageProperties from '@/src/components/Images/Properties/ImageProperties';
import { ButtonsI18nKey } from '@/src/constants/i18n';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (image: Image) => void;
  route: ApplicationRoute;
}

const AddImageModal: FC<Props> = ({ isModalOpen, modalTitle, onClose, onApply, route }) => {
  const t = useI18n();

  const [image, setImage] = useState<Image>(getImageTemplate(route) as Image);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [versionError, setVersionError] = useState<FieldError | null>(null);

  const containerClassName = classNames('flex flex-col w-full lg:max-w-[75%] md:max-w-[90%]');

  const onChange = useCallback((image: Image) => {
    setImage(image);
  }, []);

  useEffect(() => {
    setIsValid(validateImage(image) && !versionError);
  }, [image, versionError]);

  return (
    <DialPopup
      onClose={onClose}
      title={modalTitle}
      portalId="AddImageModal"
      open={isModalOpen}
      className={containerClassName}
    >
      <div className="flex h-full overflow-auto">
        <ImageProperties
          image={image}
          setImage={onChange}
          isModal={true}
          route={route}
          setVersionError={setVersionError}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Add)}
          disabled={!isValid}
          onClick={() => {
            if (image) {
              onApply(image);
            }
            onClose();
          }}
        />
      </div>
    </DialPopup>
  );
};

export default AddImageModal;
