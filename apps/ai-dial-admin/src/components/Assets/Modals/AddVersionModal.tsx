import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import semver from 'semver';

import VersionControl from '@/src/components/BaseControls/Version';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getAssetVersionBusinessError, SEMANTIC_VERSION_VALIDATION_FIELD } from '@/src/utils/deployments/validation';

interface Props {
  header: string;
  isModalOpen: boolean;
  existingVersions?: Record<string, string[]>;
  entityName?: string;
  submitLabel?: string;
  defaultVersion?: string;
  onClose: () => void;
  description?: string;
  onConfirm: (version: string) => void;
}

const AddVersionModal: FC<Props> = ({
  submitLabel,
  onConfirm,
  header,
  isModalOpen,
  onClose,
  description,
  existingVersions,
  entityName,
  defaultVersion,
}) => {
  const t = useI18n();
  const { dispatch, errorFields } = useSaveValidationContext();

  const isValid = useMemo(
    () => errorFields?.get('version') !== false && errorFields?.get(SEMANTIC_VERSION_VALIDATION_FIELD) !== false,
    [errorFields],
  );

  const [version, setVersion] = useState(() => {
    if (defaultVersion) {
      return defaultVersion;
    }
    const versions = existingVersions?.[entityName || ''] || [];
    const maxVersion = versions?.length
      ? versions.reduce((max, v) => (semver.gt(v, max) ? v : max), versions[0])
      : '0.0.0';
    return semver.inc(maxVersion, 'patch') || '0.0.1';
  });
  const [versionError, setVersionError] = useState<FieldError | null>(null);

  const validateVersion = useCallback(
    (version?: string) => {
      const error = getAssetVersionBusinessError(existingVersions, entityName, t, version);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
      setVersionError(error);
    },
    [dispatch, entityName, t, existingVersions],
  );

  const onVersionChange = useCallback(
    (version?: string) => {
      validateVersion(version);
      setVersion(version || '');
    },
    [validateVersion],
  );

  useEffect(() => {
    return () => {
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: true });
      dispatch({ type: ValidationActionType.SetField, field: SEMANTIC_VERSION_VALIDATION_FIELD, isValid: true });
    };
  }, [dispatch]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={header}
      portalId="newVersionModal"
      open={isModalOpen}
      size={PopupSize.Sm}
      onCancel={onClose}
      onSubmit={() => onConfirm(version)}
      disableSubmitButton={!!existingVersions?.[version] || !isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={submitLabel || t(ButtonsI18nKey.Create)}
    >
      <div className="flex flex-col gap-4 dial-small-text px-6 py-4">
        {description && <div className="text-secondary">{description}</div>}

        <VersionControl version={version} error={versionError?.text} onChange={onVersionChange} />
      </div>
    </DialFormPopup>
  );
};

export default AddVersionModal;
