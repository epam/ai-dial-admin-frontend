'use client';

import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import IdControl from '@/src/components/BaseControls/Id/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorForPath } from '@/src/utils/validation/path-error';

interface RouteCreateEntity {
  name?: string;
  paths?: string[];
}

interface Props {
  entity: RouteCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
}

/**
 * Create-modal body for a new route: the plain Core entity-name field `Assets > Models`/
 * `Assets > Interceptors` also use via `IdControl`, plus one required initial path. No display name or
 * description control — `Route extends RoleBasedEntity` directly, unlike `Interceptor`/`Model`, which
 * extend `Deployment` and have both. Bypassed here for the same reason
 * the generic `EntityProperties`: that form always renders a `DisplayNameControl`
 * (`entity.displayName`) alongside the id field, and `CreateEntity`'s default initial state seeds
 * `description`, too — neither field exists on `Route`, and Core's `Route.class` deserializer rejects
 * the whole write once either is present in the body.
 */
const RouteCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [pathError, setPathError] = useState<string | undefined>(void 0);

  const onChangePath = useCallback(
    (path?: string) => {
      onChangeEntity({ ...entity, paths: path ? [path] : [] });
      const pathError = getErrorForPath(path, t);
      setPathError(pathError?.text);
      dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !pathError });
    },
    [dispatch, entity, onChangeEntity, t],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <IdControl
        label={t(EntityFieldsI18nKey.id)}
        placeholder={t(EntityPlaceholdersI18nKey.Id)}
        entity={entity}
        names={names}
        isUniqueNameError={isUniqueNameError}
        onChangeEntity={onChangeEntity}
      />
      <DialInput
        id="path"
        placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
        labelProps={{ label: t(EntityFieldsI18nKey.paths), required: true }}
        value={entity.paths?.[0]}
        error={pathError}
        invalid={!!pathError}
        onChange={onChangePath}
      />
    </div>
  );
};

export default RouteCreateProperties;
