import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import VersionControl from '@/src/components/BaseControls/Version';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';

interface Props {
  heading: string;
  isModalOpen: boolean;
  existingVersions: string[];
  prefilledVersion?: string;
  onClose: () => void;
  onConfirm: (version: string) => void;
}

const AddVersionModal: FC<Props> = ({
  heading,
  isModalOpen,
  existingVersions,
  prefilledVersion,
  onConfirm,
  onClose,
}) => {
  const t = useI18n();
  const [version, setVersion] = useState<string>(prefilledVersion || '');
  const { isValid } = useSaveValidationContext();

  return (
    <DialFormPopup
      onClose={onClose}
      header={heading}
      portalId="newVersionModal"
      open={isModalOpen}
      onCancel={onClose}
      onSubmit={() => onConfirm(version)}
      disableSubmitButton={existingVersions.includes(version) || !isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
    >
      <div className="flex flex-col gap-4 text-primary small px-6 py-4">
        {prefilledVersion && <div className="text-secondary">{t(PromptsI18nKey.NewVersionSaveDescription)}</div>}
        <VersionControl version={version} onChange={(v) => setVersion(v || '')} />
      </div>
    </DialFormPopup>
  );
};

export default AddVersionModal;
