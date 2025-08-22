import { FC, useCallback, useEffect, useMemo } from 'react';

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

  const pathError = useMemo(() => {
    return getErrorForPath((entity as DialRoute).paths?.[0], t);
  }, [entity, t]);

  const versionError = useMemo(() => {
    const isValidVersion = !checkNameVersionCombination(versionsMap, entity.name as string, entity.version || '');
    return isValidVersion ? void 0 : t(ErrorI18nKey.NameVersionCombination);
  }, [versionsMap, entity.name, entity.version, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !versionError });
  }, [versionError, t, dispatch]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !pathError });
  }, [pathError, t, dispatch]);

  const onChangeVersion = useCallback(
    (version: string) => {
      onChangeEntity({ ...entity, version });
    },
    [entity, onChangeEntity],
  );

  const onChangePath = useCallback(
    (path: string) => {
      onChangeEntity({ ...entity, paths: [path] } as DialRoute);
    },
    [entity, onChangeEntity],
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
          errorText={versionError}
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
