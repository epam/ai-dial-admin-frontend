import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { getSourceItems } from '@/src/components/SourceField/constants';
import SourceField from '@/src/components/SourceField/SourceField';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorForPath } from '@/src/utils/validation/path-error';
import { getInterceptorContainers } from '@/src/app/actions/deployments';

interface Props {
  view?: ApplicationRoute;
  entity: BaseEntity;
  names: string[];
  versionsMap?: Record<string, string[]>;
  isUniqueNameError?: boolean;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: BaseEntity) => void;
  initialValues?: Partial<BaseEntity>;
}

const EntityProperties: FC<Props> = ({
  view,
  entity,
  names,
  isUniqueNameError,
  onChangeEntity,
  isEntityImmutable = false,
  initialValues,
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const { featureFlags } = useAppContext();

  const [pathError, setPathError] = useState<string | undefined>(void 0);

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
    <div className="flex flex-col gap-y-8">
      {!isEntityImmutable && (
        <IdControl
          label={t(EntityFieldsI18nKey.id)}
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          entity={entity}
          names={names}
          isUniqueNameError={isUniqueNameError}
          onChangeEntity={onChangeEntity}
        />
      )}

      <DisplayNameControl
        displayName={entity.displayName}
        required
        isFullWidth={!isEntityImmutable}
        onChange={(name) => onChangeEntity({ ...entity, displayName: name })}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} isFullWidth={!isEntityImmutable} />

      {view === ApplicationRoute.Interceptors && !isEntityImmutable && !initialValues && (
        <SourceField
          view={ApplicationRoute.Interceptors}
          entity={entity}
          onChange={onChangeEntity}
          getContainers={getInterceptorContainers}
          getRunners={getInterceptorTemplatesList}
          id="sourceType"
          label={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(ApplicationRoute.Interceptors, featureFlags.deploymentsEnabled)}
          isModal={!isEntityImmutable}
        />
      )}

      {view === ApplicationRoute.Routes && (
        <DialInput
          id="path"
          placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
          labelProps={{ label: t(EntityFieldsI18nKey.paths), required: true }}
          value={(entity as DialRoute).paths?.[0]}
          error={pathError}
          invalid={!!pathError}
          onChange={onChangePath}
        />
      )}
    </div>
  );
};

export default EntityProperties;
