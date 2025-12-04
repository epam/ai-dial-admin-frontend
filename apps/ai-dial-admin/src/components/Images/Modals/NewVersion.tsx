import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import semver from 'semver';
import { ButtonVariant, DialButton, DialPopup, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { getVersionsPerName } from '@/src/components/Assets/utils';

interface Props {
  isModalOpen: boolean;
  title: string;
  okLabel: string;
  onClose: () => void;
  onApply: (image: Image) => void;
  image: Image;
  versions: ImageVersion[];
}

const NewVersion: FC<Props> = ({ isModalOpen, title, onClose, onApply, image, versions, okLabel }) => {
  const t = useI18n();

  const containerClassName = classNames('flex flex-col w-full md:max-w-[330px] lg:max-w-[330px]');
  const [version, setVersion] = useState<string>(semver.inc(image.version, 'patch') || '0.0.1');
  const [versionError, setVersionError] = useState<FieldError | null>(null);

  useEffect(() => {
    setVersionError(getSemanticVersionError(getVersionsPerName(versions), image as { name: string }, t, version));
  }, [image, t, version, versions]);

  return (
    <DialPopup
      onClose={onClose}
      title={title}
      portalId="BuildImageModal"
      open={isModalOpen}
      className={containerClassName}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4">
        <DialTextInputField
          elementContainerClassName="max-w-[120px]"
          elementId="version"
          fieldTitle={t(EntityFieldsI18nKey.version)}
          onChange={(version?: string) => {
            setVersionError(
              getSemanticVersionError(getVersionsPerName(versions), image as { name: string }, t, version),
            );
            setVersion(version || '');
          }}
          value={version}
          invalid={!!versionError}
          errorText={versionError?.text}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={okLabel}
          disabled={!!versionError}
          onClick={() => {
            onApply({ ...image, version });
            onClose();
          }}
        />
      </div>
    </DialPopup>
  );
};

export default NewVersion;
