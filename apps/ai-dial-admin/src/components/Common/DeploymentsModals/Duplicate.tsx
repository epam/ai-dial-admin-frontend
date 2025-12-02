import { FC, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { useI18n } from '@/src/locales/client';
import { BasicI18nKey, ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  title: string;
  isModalOpen: boolean;
  currentName: string;
  onClose: () => void;
  onApply: (name: string) => void;
  names: string[];
}

const DuplicateModal: FC<Props> = ({ title, isModalOpen, currentName, onClose, onApply, names }) => {
  const t = useI18n() as (key: string) => string;
  const [name, setName] = useState(`${currentName} ${t(BasicI18nKey.DuplicateCopy)}`);
  const [nameError, setNameError] = useState<FieldError | null>(null);

  useEffect(() => {
    setNameError(getErrorForName(name, names, t));
  }, [name, names, t]);

  return (
    <DialPopup
      onClose={onClose}
      title={title}
      portalId="DuplicateImageModal"
      open={isModalOpen}
      cssClass="flex flex-col lg:max-w-[55%] md:max-w-[75%]"
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4">
        <DialTextInputField
          elementId="name"
          fieldTitle={t(BasicI18nKey.Name)}
          placeholder={t(EntityPlaceholdersI18nKey.Name)}
          value={name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={(name?: string) => {
            setNameError(getErrorForName(name, names, t));
            setName(name as string);
          }}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Duplicate)}
          onClick={() => {
            onApply(name);
            onClose();
          }}
          disabled={!!nameError}
        />
      </div>
    </DialPopup>
  );
};

export default DuplicateModal;
