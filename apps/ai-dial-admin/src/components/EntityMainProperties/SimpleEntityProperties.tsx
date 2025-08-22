import { FC, useCallback, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { checkNameVersionCombination } from '@/src/utils/prompts/versions';
import { getErrorForPath } from '@/src/utils/validation/path-error';
import { FieldError } from '@/src/models/error';

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
  const { dispatch } = useSaveValidationContext();

  const idTitleKey =
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files
      ? EntityFieldsI18nKey.displayName
      : EntityFieldsI18nKey.id;

  const idPlaceholderKey =
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files
      ? EntityPlaceholdersI18nKey.DisplayName
      : EntityPlaceholdersI18nKey.Id;

  const [versionError, setVersionError] = useState<FieldError | undefined>(void 0);
  const [pathError, setPathError] = useState<FieldError | undefined>(void 0);

  const onChangeVersion = useCallback(
    (version: string) => {
      onChangeEntity({ ...entity, version });
      const isValidVersion = !checkNameVersionCombination(versionsMap, entity.name as string, entity.version || '');
      const versionError = isValidVersion && versionsMap ? void 0 : t(ErrorI18nKey.NameVersionCombination);
      setVersionError(versionError);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !versionError });
    },
    [dispatch, entity, onChangeEntity, t, versionsMap],
  );

  const onChangePath = useCallback(
    (path: string) => {
      onChangeEntity({ ...entity, paths: [path] } as DialRoute);
      const pathError = getErrorForPath((entity as DialRoute).paths?.[0], t);
      setPathError(pathError);
      dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !pathError });
    },
    [dispatch, entity, onChangeEntity, t],
  );

  return (
    <div className="flex flex-col gap-6">
      {!isEntityImmutable && (
        <IdControl
          fieldTitle={t(idTitleKey)}
          placeholder={t(idPlaceholderKey)}
          entity={entity}
          names={names}
          onChangeEntity={onChangeEntity}
        />
      )}

      <DisplayNameControl
        displayName={entity.displayName}
        onChange={(name) => onChangeEntity({ ...entity, displayName: name })}
      />

      {versionsMap && (
        <TextInputField
          elementId="version"
          fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
          placeholder={t(EntityPlaceholdersI18nKey.Version)}
          disabled={isEntityImmutable}
          errorText={versionError?.text}
          invalid={!!versionError}
          value={entity.version}
          onChange={onChangeVersion}
        />
      )}

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
