import { FC, useCallback, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { FieldError } from '@/src/models/error';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import AppRunnerExtendedProperties from './ExtendedProperties';
import { getErrorForAppRunnerId } from './utils';

interface Props {
  runner: DialApplicationScheme;
  isImmutable?: boolean;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const SchemeProperties: FC<Props> = ({ runner, isImmutable, onChangeRunner }) => {
  const t = useI18n() as (t: string) => string;

  const [idError, setIdError] = useState<FieldError | null>(null);

  const onChangeId = useCallback(
    (id?: string) => {
      setIdError(getErrorForAppRunnerId(id, t));
      onChangeRunner({
        ...runner,
        $id: id,
      });
    },
    [onChangeRunner, runner, t],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeDisplayName': name });
    },
    [runner, onChangeRunner],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {!isImmutable && (
        <TextInputField
          elementId="id"
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          fieldTitle={t(EntityFieldsI18nKey.id)}
          value={runner.$id}
          errorText={idError?.text}
          invalid={!!idError}
          onChange={onChangeId}
        />
      )}

      <TextInputField
        elementId="name"
        fieldTitle={t(EntityFieldsI18nKey.displayName)}
        placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
        value={runner['dial:applicationTypeDisplayName']}
        onChange={onChangeName}
      />

      <DescriptionControl entity={runner} onChangeEntity={onChangeRunner} />

      {isImmutable && <AppRunnerExtendedProperties runner={runner} onChangeRunner={onChangeRunner} />}
    </div>
  );
};

export default SchemeProperties;
