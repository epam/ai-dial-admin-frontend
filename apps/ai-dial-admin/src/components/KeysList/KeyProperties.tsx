import { FC, useCallback, useEffect, useMemo } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Switch from '@/src/components/Common/Switch/Switch';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import KeyGenerateField from './KeyGenerateField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';

interface Props {
  entity: DialKey;
  names: string[];
  keys: string[];
  isKeyImmutable?: boolean;
  onChangeKey: (key: DialKey) => void;
}

const KeyProperties: FC<Props> = ({ entity, names, keys, isKeyImmutable, onChangeKey }) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const isValidKey = useMemo(() => {
    return !!entity.key && !(entity.key.length > MAX_NAME_SYMBOLS);
  }, [entity.key]);

  const projectError = useMemo(() => {
    return entity.project ? void 0 : t(ErrorI18nKey.RequiredField);
  }, [entity.project, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'project', isValid: !projectError });
  }, [entity.project, dispatch, projectError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'key', isValid: isValidKey });
  }, [isValidKey, dispatch]);

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
      {!isKeyImmutable && <IdControl entity={entity} names={names} onChangeEntity={onChangeKey} />}

      <DisplayNameControl
        displayName={entity.displayName}
        onChange={(displayName: string) => onChangeKey({ ...entity, displayName })}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeKey} />

      <TextInputField
        elementId="project"
        fieldTitle={t(EntityFieldsI18nKey.project)}
        placeholder={t(EntityPlaceholdersI18nKey.Project)}
        value={entity.project}
        errorText={projectError}
        onChange={onChangeProject}
        invalid={!!projectError}
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
