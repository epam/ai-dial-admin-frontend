import { FC, useCallback, useEffect, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { CreateI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { checkNameVersionCombination } from '@/src/components/PromptsList/prompts-list';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';
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

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
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
      setVersionError(isValidVersion ? void 0 : t(CreateI18nKey.NameVersionCombinationError));
    }
  }, [t, versionsMap, isValidVersion]);

  const onChangeDescription = useCallback(
    (description: string) => {
      setDescriptionError(getErrorForDescription(description, t));
      onChangeEntity({ ...entity, description });
    },
    [entity, onChangeEntity, t],
  );

  const onChangePath = useCallback(
    (path: string) => {
      onChangeEntity({ ...entity, paths: [path] } as DialRoute);
      setPathError(getErrorForPath(path, t));
    },
    [entity, onChangeEntity, t],
  );

  return (
    <div className="flex flex-col gap-6">
      <TextInputField
        elementId="name"
        fieldTitle={t(CreateI18nKey.NameTitle)}
        placeholder={t(CreateI18nKey.NamePlaceholder)}
        value={entity.name}
        disabled={isEntityImmutable}
        errorText={nameError?.text}
        invalid={!!nameError}
        onChange={onChangeName}
        iconAfterInput={isEntityImmutable && <CopyButton field={entity.name} />}
      />
      {versionsMap && (
        <TextInputField
          elementId="version"
          fieldTitle={t(CreateI18nKey.VersionTitle)}
          placeholder={t(CreateI18nKey.VersionPlaceholder)}
          disabled={isEntityImmutable}
          errorText={versionError}
          invalid={!isValidVersion}
          value={entity.version}
          onChange={onChangeVersion}
        />
      )}
      <TextAreaField
        elementId="description"
        fieldTitle={t(CreateI18nKey.DescriptionTitle)}
        placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
        optional={true}
        value={entity.description}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        onChange={onChangeDescription}
        elementCssClass="w-full"
      />

      {view === ApplicationRoute.Routes && (
        <TextInputField
          elementId="path"
          placeholder={t(RoutesI18nKey.PathPlaceholder)}
          fieldTitle={t(RoutesI18nKey.PathTitle)}
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
