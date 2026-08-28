'use client';

import { FC } from 'react';

import IdControl from '@/src/components/BaseControls/Id/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface RouteCreateEntity {
  name?: string;
}

interface Props {
  entity: RouteCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
}

/**
 * Create-modal body for a new route: just the plain Core entity-name field `Assets > Models`/
 * `Assets > Interceptors` also use via `IdControl`. No display name or description control — `Route
 * extends RoleBasedEntity` directly, unlike `Interceptor`/`Model`, which extend `Deployment` and have
 * both. Bypassed here for the same reason `AppRunnerCreateProperties`/`SkillCreateProperties` bypass
 * the generic `EntityProperties`: that form always renders a `DisplayNameControl`
 * (`entity.displayName`) alongside the id field, and `CreateEntity`'s default initial state seeds
 * `description`, too — neither field exists on `Route`, and Core's `Route.class` deserializer rejects
 * the whole write once either is present in the body.
 */
const RouteCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity }) => {
  const t = useI18n();

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
    </div>
  );
};

export default RouteCreateProperties;
