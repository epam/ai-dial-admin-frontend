import { FC, useCallback, useState } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Switch from '@/src/components/Common/Switch/Switch';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { CreateI18nKey } from '@/src/constants/i18n';
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
      <TextInputField
        elementId="name"
        fieldTitle={t(CreateI18nKey.NameTitle)}
        placeholder={t(CreateI18nKey.NamePlaceholder)}
        value={entity.name}
        errorText={nameError?.text}
        invalid={!!nameError}
        onChange={onChangeName}
        disabled={isKeyImmutable}
        iconAfterInput={isKeyImmutable && <CopyButton field={entity.name} />}
      />
      <TextAreaField
        elementId="description"
        fieldTitle={t(CreateI18nKey.DescriptionTitle)}
        placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
        optional={true}
        value={entity.description}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        onChange={onChangeDescription}
      />
      <TextInputField
        elementId="project"
        fieldTitle={t(CreateI18nKey.ProjectTitle)}
        placeholder={t(CreateI18nKey.ProjectPlaceholder)}
        value={entity.project}
        onChange={onChangeProject}
      />
      {isKeyImmutable && (
        <TextInputField
          elementId="projectContact"
          fieldTitle={t(CreateI18nKey.ProjectContactPointTitle)}
          placeholder={t(CreateI18nKey.ProjectContactPointPlaceholder)}
          value={entity.projectContactPoint}
          onChange={onChangeProjectContactPoint}
        />
      )}
      <KeyGenerateField isKeyImmutable={isKeyImmutable} keys={keys} selectedKey={entity} changeKey={changeKey} />

      {isKeyImmutable && (
        <Switch
          isOn={entity.secured}
          title={t(CreateI18nKey.SecuredTitle)}
          switchId="secured"
          onChange={onChangeSecured}
        />
      )}
      {!isKeyImmutable && <ValidityPeriodInput onChange={onChangeExpiresAt} />}
    </div>
  );
};

export default KeyProperties;
