import { FC, useCallback, useEffect, useState } from 'react';
import semver from 'semver';
import { DialConfirmationPopup, DialTextInputField } from '@epam/ai-dial-ui-kit';

import { Image, ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { getVersionsPerName } from '@/src/components/Assets/utils';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  isModalOpen: boolean;
  title: string;
  okLabel: string;
  onClose: () => void;
  onApply: (image: Image) => void;
  image: Image;
  versions: ImageVersion[];
}

const ImageNewVersion: FC<Props> = ({ isModalOpen, title, onClose, onApply, image, versions, okLabel }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();

  const [version, setVersion] = useState<string>(semver.inc(image.version, 'patch') || '0.0.1');
  const [versionError, setVersionError] = useState<FieldError | null>(null);

  const validateVersion = useCallback(
    (version?: string) => {
      const error = getSemanticVersionError(getVersionsPerName(versions), image.name, t, version);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
      setVersionError(error);
    },
    [dispatch, image, t, versions],
  );

  const onVersionChange = useCallback(
    (version?: string) => {
      validateVersion(version);
      setVersion(version || '');
    },
    [validateVersion],
  );

  useEffect(() => {
    validateVersion(version);
  }, [validateVersion, version]);

  return (
    <DialConfirmationPopup
      portalId="ImageNewVersionModal"
      onClose={onClose}
      header={title}
      open={isModalOpen}
      onConfirm={() => {
        onApply({ ...image, version });
        onClose();
      }}
      disableConfirmButton={!isValid}
      confirmLabel={okLabel}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4">
        <DialTextInputField
          elementContainerClassName="max-w-[120px]"
          elementId="version"
          fieldTitle={t(EntityFieldsI18nKey.version)}
          onChange={onVersionChange}
          value={version}
          invalid={!!versionError}
          errorText={versionError?.text}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default ImageNewVersion;
