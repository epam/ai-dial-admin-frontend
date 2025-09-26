import { FC, useCallback, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorForPath } from '@/src/utils/validation/path-error';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getPromptVersionError } from '@/src/utils/validation/version-error';
import { DialPrompt } from '@/src/models/dial/prompt';
import { getInterceptorContainers } from '@/src/app/[lang]/interceptors/actions';
import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import { getSourceItems } from '@/src/components/SourceField/constants';
import SourceField from '@/src/components/SourceField/SourceField';
import { useAppContext } from '@/src/context/AppContext';
import { isDeploymentsEnabled } from '@/src/utils/plugins';

interface Props {
  view?: ApplicationRoute;
  entity: BaseEntity;
  names: string[];
  versionsMap?: Record<string, string[]>;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: BaseEntity) => void;
  isModal?: boolean;
}

const SimpleEntityProperties: FC<Props> = ({
  view,
  entity,
  names,
  onChangeEntity,
  isEntityImmutable = false,
  versionsMap,
  isModal,
}) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();
  const { embeddedApps } = useAppContext();
  const deploymentsEnabled = isDeploymentsEnabled(embeddedApps);

  const idTitleKey =
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files || view === ApplicationRoute.AssetsApplications
      ? EntityFieldsI18nKey.displayName
      : EntityFieldsI18nKey.id;

  const idPlaceholderKey =
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files || view === ApplicationRoute.AssetsApplications
      ? EntityPlaceholdersI18nKey.DisplayName
      : EntityPlaceholdersI18nKey.Id;

  const [versionError, setVersionError] = useState<string | undefined>(void 0);
  const [pathError, setPathError] = useState<string | undefined>(void 0);

  const validateVersion = useCallback(
    (version?: string) => {
      const versionError = getPromptVersionError(versionsMap, entity, t, version);
      setVersionError(versionError);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !versionError });
    },
    [dispatch, entity, t, versionsMap],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      onChangeEntity({ ...entity, version } as DialPrompt);
      validateVersion(version);
    },
    [entity, onChangeEntity, validateVersion],
  );

  const onChangePath = useCallback(
    (path?: string) => {
      onChangeEntity({ ...entity, paths: path ? [path] : [] } as DialRoute);
      const pathError = getErrorForPath(path, t);
      setPathError(pathError?.text);
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
      {/* not need for prompts */}
      {!versionsMap && (
        <DisplayNameControl
          displayName={entity.displayName}
          onChange={(name) => onChangeEntity({ ...entity, displayName: name })}
        />
      )}

      {versionsMap && (
        <VersionControl version={(entity as DialPrompt).version} onChange={onChangeVersion} error={versionError} />
      )}

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />

      {view === ApplicationRoute.Interceptors && isModal && (
        <SourceField
          view={ApplicationRoute.Interceptors}
          entity={entity}
          onChange={onChangeEntity}
          getContainers={getInterceptorContainers}
          getRunners={getInterceptorTemplatesList}
          elementId={'sourceType'}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(ApplicationRoute.Interceptors, deploymentsEnabled)}
          isModal={isModal}
        />
      )}

      {view === ApplicationRoute.Routes && (
        <TextInputField
          elementId="path"
          placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
          fieldTitle={t(EntityFieldsI18nKey.paths)}
          value={(entity as DialRoute).paths?.[0]}
          errorText={pathError}
          invalid={!!pathError}
          onChange={onChangePath}
        />
      )}
    </div>
  );
};

export default SimpleEntityProperties;
