import { DialTextInputField } from '@epam/ai-dial-ui-kit';
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
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: BaseEntity) => void;
  initialValues?: Partial<BaseEntity>;
}

const EntityProperties: FC<Props> = ({
  view,
  entity,
  names,
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
          fieldTitle={t(EntityFieldsI18nKey.id)}
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          entity={entity}
          names={names}
          onChangeEntity={onChangeEntity}
        />
      )}

      <DisplayNameControl
        displayName={entity.displayName}
        required={true}
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
          elementId="sourceType"
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(ApplicationRoute.Interceptors, featureFlags.deploymentsEnabled)}
          isModal={!isEntityImmutable}
        />
      )}

      {view === ApplicationRoute.Routes && (
        <DialTextInputField
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

export default EntityProperties;
