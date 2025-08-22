import { FC, useCallback } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Switch from '@/src/components/Common/Switch/Switch';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
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
