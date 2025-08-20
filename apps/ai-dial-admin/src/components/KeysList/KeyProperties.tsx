import { FC, useCallback, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Switch from '@/src/components/Common/Switch/Switch';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import KeyGenerateField from './KeyGenerateField';

interface Props {
  entity: DialKey;
  names: string[];
  keys: string[];
  isKeyImmutable?: boolean;
  onChangeKey: (key: DialKey) => void;
}

const KeyProperties: FC<Props> = ({ entity, names, keys, isKeyImmutable, onChangeKey }) => {
  const t = useI18n() as (t: string) => string;

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  const onChangeName = useCallback(
    (name: string) => {
      setNameError(getErrorForName(name, names, t));
      onChangeKey({
        ...entity,
        name: name.trim(),
      });
    },
    [onChangeKey, entity, names, t],
  );

  const onChangeDescription = useCallback(
    (description: string) => {
      setDescriptionError(getErrorForDescription(description, t));
      onChangeKey({ ...entity, description });
    },
    [entity, onChangeKey, t],
  );

  const onChangeProject = useCallback(
    (project: string) => {
      onChangeKey({ ...entity, project });
    },
    [entity, onChangeKey],
  );

  const onChangeProjectContactPoint = useCallback(
    (projectContactPoint: string) => {
      onChangeKey({ ...entity, projectContactPoint });
    },
    [entity, onChangeKey],
  );

  const onChangeSecured = useCallback(
    (secured: boolean) => {
      onChangeKey({ ...entity, secured });
    },
    [entity, onChangeKey],
  );

  const onChangeExpiresAt = useCallback(
    (expiresAt: number) => {
      onChangeKey({ ...entity, expiresAt });
    },
    [entity, onChangeKey],
  );

  const changeKey = useCallback(
    (key: DialKey) => {
      onChangeKey(key);
    },
    [onChangeKey],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {!isKeyImmutable && (
        <TextInputField
          elementId="name"
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          fieldTitle={t(EntityFieldsI18nKey.id)}
          value={entity.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={onChangeName}
        />
      )}
      <TextAreaField
        elementId="description"
        fieldTitle={t(EntityFieldsI18nKey.description)}
        placeholder={t(EntityPlaceholdersI18nKey.Description)}
        optional={true}
        value={entity.description}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        onChange={onChangeDescription}
      />
      <TextInputField
        elementId="project"
        fieldTitle={t(EntityFieldsI18nKey.project)}
        placeholder={t(EntityPlaceholdersI18nKey.Project)}
        value={entity.project}
        onChange={onChangeProject}
      />
      {isKeyImmutable && (
        <TextInputField
          elementId="projectContact"
          fieldTitle={t(EntityFieldsI18nKey.projectContactPoint)}
          placeholder={t(EntityPlaceholdersI18nKey.ContactPoint)}
          value={entity.projectContactPoint}
          onChange={onChangeProjectContactPoint}
        />
      )}
      <KeyGenerateField isKeyImmutable={isKeyImmutable} keys={keys} selectedKey={entity} changeKey={changeKey} />

      {isKeyImmutable && (
        <Switch
          isOn={entity.secured}
          title={t(EntityFieldsI18nKey.secured)}
          switchId="secured"
          onChange={onChangeSecured}
        />
      )}
      {!isKeyImmutable && <ValidityPeriodInput onChange={onChangeExpiresAt} />}
    </div>
  );
};

export default KeyProperties;
