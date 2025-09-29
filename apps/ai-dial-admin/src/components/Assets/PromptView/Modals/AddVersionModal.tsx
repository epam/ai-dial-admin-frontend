import { FC, useState } from 'react';
import { DialButton } from '@epam/ai-dial-ui-kit';

import Popup from '@/src/components/Common/Popup/Popup';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  heading: string;
  modalState: PopUpState;
  existingVersions: string[];
  prefilledVersion?: string;
  onClose: () => void;
  onConfirm: (version: string) => void;
}

const AddVersionModal: FC<Props> = ({
  heading,
  modalState,
  existingVersions,
  prefilledVersion,
  onConfirm,
  onClose,
}) => {
  const t = useI18n();
  const [version, setVersion] = useState<string>(prefilledVersion || '');

  return (
    <Popup onClose={onClose} heading={heading} portalId="newVersionModal" state={modalState}>
      <div className=" flex flex-col gap-4 text-primary small px-6 py-4">
        {prefilledVersion && <div className="text-secondary">{t(PromptsI18nKey.NewVersionSaveDescription)}</div>}
        <VersionControl version={version} onChange={(v) => setVersion(v || '')} />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <DialButton cssClass="dial-secondary-button" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <DialButton
          cssClass="dial-primary-button"
          title={t(ButtonsI18nKey.Create)}
          onClick={() => onConfirm(version)}
          disable={existingVersions.includes(version)}
        />
      </div>
    </Popup>
  );
};

export default AddVersionModal;
