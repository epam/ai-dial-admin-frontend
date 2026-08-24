'use client';

import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface SkillCreateEntity {
  name?: string;
  description?: string;
}

interface Props {
  entity: SkillCreateEntity;
  names: string[];
  onChangeEntity: (entity: object) => void;
}

/**
 * Create-modal body for a new skill: just `Name` and `Description`, neither of which fit
 * `AssetProperties` (no version, no display name). Bypassed here for the same reason
 * `AppRunnerCreateProperties` bypasses it for App Runner's own flat identity.
 *
 * `Name` reuses `getErrorForName`'s `isDeploymentId` branch — the existing `/^[a-z0-9-]+$/`
 * charset check and `ContainerId` copy already used for deployment-id-shaped fields — rather than a
 * new regex/message, but validates directly instead of through `IdControl`: that control's
 * duplicate-name message switches on whether its `label` prop equals "ID", which would misword the
 * message for a field labeled "Name".
 */
const SkillCreateProperties: FC<Props> = ({ entity, names, onChangeEntity }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [nameError, setNameError] = useState<FieldError | null>(null);

  const validateName = useCallback(
    (name?: string) => {
      const isDuplicate = !!name && names.includes(name);
      const error = isDuplicate
        ? { type: ErrorType.EXISTING, text: t(ErrorI18nKey.SkillNameExists) }
        : getErrorForName(name, undefined, t, false, true, false, true);
      setNameError(name ? error : null);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error && !!name });
    },
    [dispatch, names, t],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      const trimmedName = name?.trimStart();
      onChangeEntity({ ...entity, name: trimmedName });
      validateName(trimmedName);
    },
    [entity, onChangeEntity, validateName],
  );

  const onChangeDescription = useCallback(
    (updated: SkillCreateEntity) => {
      onChangeEntity({ ...entity, description: updated.description });
      dispatch({ type: ValidationActionType.SetField, field: 'descriptionRequired', isValid: !!updated.description });
    },
    [dispatch, entity, onChangeEntity],
  );

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: false });
    dispatch({ type: ValidationActionType.SetField, field: 'descriptionRequired', isValid: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-8">
      <DialInput
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        labelProps={{ label: t(EntityFieldsI18nKey.name), required: true }}
        id="skill-name"
        value={entity.name}
        onChange={onChangeName}
        error={nameError?.text}
        invalid={!!nameError}
      />

      <DescriptionControl entity={{ description: entity.description }} onChangeEntity={onChangeDescription} required />
    </div>
  );
};

export default SkillCreateProperties;
