import { FC, useCallback, useEffect, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialRoute } from '@/src/models/dial/route';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { checkNameVersionCombination } from '@/src/utils/prompts/versions';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { getErrorForPath } from '@/src/utils/validation/path-error';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';

interface Props {
  view?: ApplicationRoute;
  entity: DialBaseNamedEntity;
  names: string[];
  versionsMap?: Record<string, string[]>;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialBaseNamedEntity) => void;
}

const SimpleEntityProperties: FC<Props> = ({
  view,
  entity,
  names,
  onChangeEntity,
  isEntityImmutable = false,
  versionsMap,
}) => {
  const t = useI18n() as (t: string) => string;
  const idTitleKey =
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files
      ? EntityFieldsI18nKey.displayName
      : EntityFieldsI18nKey.id;

  const idPlaceholderKey =
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files
      ? EntityPlaceholdersI18nKey.DisplayName
      : EntityPlaceholdersI18nKey.Id;

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [pathError, setPathError] = useState<FieldError | null>(null);

  const [versionError, setVersionError] = useState<string | undefined>(void 0);
  const [isValidVersion, setIsValidVersion] = useState(true);

  const onChangeName = useCallback(
    (name: string) => {
      onChangeEntity({ ...entity, name });
      if (versionsMap) {
        setIsValidVersion(!checkNameVersionCombination(versionsMap, name, entity.version as string));
        setNameError(getErrorForName(name, names, t));
      } else {
        setNameError(getErrorForName(name, names, t));
      }
    },
    [entity, onChangeEntity, names, versionsMap, t],
  );

  const onChangeVersion = useCallback(
    (version: string) => {
      onChangeEntity({ ...entity, version });
      if (versionsMap) {
        setIsValidVersion(!checkNameVersionCombination(versionsMap, entity.name as string, version));
      }
    },
    [entity, onChangeEntity, versionsMap],
  );

  useEffect(() => {
    if (versionsMap) {
      setVersionError(isValidVersion ? void 0 : t(ErrorI18nKey.NameVersionCombination));
    }
  }, [t, versionsMap, isValidVersion]);

  const onChangePath = useCallback(
    (path: string) => {
      onChangeEntity({ ...entity, paths: [path] } as DialRoute);
      setPathError(getErrorForPath(path, t));
    },
    [entity, onChangeEntity, t],
  );

  return (
    <div className="flex flex-col gap-6">
      {!isEntityImmutable && (
        <TextInputField
          elementId="name"
          fieldTitle={t(idTitleKey)}
          placeholder={t(idPlaceholderKey)}
          value={entity.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={onChangeName}
        />
      )}

      <DisplayNameControl
        displayName={entity.displayName}
        onChange={(name) => onChangeEntity({ ...entity, displayName: name })}
      />

      {versionsMap && <VersionControl version={entity.version} onChange={onChangeVersion} error={versionError} />}

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />

      {view === ApplicationRoute.Routes && (
        <TextInputField
          elementId="path"
          placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
          fieldTitle={t(EntityFieldsI18nKey.paths)}
          value={(entity as DialRoute).paths?.[0]}
          errorText={pathError?.text}
          invalid={!!pathError}
          onChange={onChangePath}
        />
      )}
    </div>
  );
};

export default SimpleEntityProperties;
