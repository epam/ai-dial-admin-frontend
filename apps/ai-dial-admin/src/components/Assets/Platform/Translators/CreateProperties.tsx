'use client';

import { FC, useCallback, useEffect } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';
import IdControl from '@/src/components/BaseControls/Id/Id';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { getInterfaceTypeLabel } from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import { MODEL_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { getControlClassName } from '@/src/utils/entities/view';

interface TranslatorCreateEntity {
  name?: string;
  in?: DeploymentInterfaceType;
  out?: DeploymentInterfaceType;
  baseUrl?: string;
}

interface Props {
  entity: TranslatorCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
  /** True in the create popup (full-width inputs, `id` field shown); false on the details view
   * (`id` hidden, inputs at `STANDARD_CONTROL_WIDTH`) — see `getControlClassName`. */
  isModal?: boolean;
}

/**
 * Shared field set for a translator asset — the create-modal body **and** the details-view
 * Properties tab (`Properties.tsx` renders this with `isModal={false}`): the plain Core entity-name
 * field `Assets > Models`/`Assets > Routes` also use via `IdControl` (create only — `id` is
 * immutable once created, so the details view hides it), plus `in`/`out`/`baseUrl`. Unlike every
 * other flat platform entity, Core's `Translator.class` deserializer requires `out` and `baseUrl` on
 * every write (`@JsonProperty(required = true)`) and rejects an entry with no `in` as "declared under
 * no interface", so a name-only create (the shape `RouteCreateProperties`/`RoleCreateProperties` get
 * away with) always fails with "Failed to parse entity". No display name or description control —
 * `Translator` is a plain POJO (neither `Deployment` nor `RoleBasedEntity`), so it has neither field,
 * and Core's deserializer rejects the whole write once either is present in the body.
 */
const TranslatorCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity, isModal }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const controlClassName = getControlClassName(isModal);

  const interfaceOptions = MODEL_INTERFACE_TYPES.map((type) => ({
    value: type,
    label: getInterfaceTypeLabel(t, type),
  }));

  const onChangeIn = useCallback(
    (value: string | string[]) => {
      const inValue = value as DeploymentInterfaceType;
      onChangeEntity({ ...entity, in: inValue });
      dispatch({ type: ValidationActionType.SetField, field: 'in', isValid: !!inValue });
    },
    [entity, onChangeEntity, dispatch],
  );

  const onChangeOut = useCallback(
    (value: string | string[]) => {
      const outValue = value as DeploymentInterfaceType;
      onChangeEntity({ ...entity, out: outValue });
      dispatch({ type: ValidationActionType.SetField, field: 'out', isValid: !!outValue });
    },
    [entity, onChangeEntity, dispatch],
  );

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'in', isValid: !!entity.in });
    dispatch({ type: ValidationActionType.SetField, field: 'out', isValid: !!entity.out });

    return () => {
      dispatch({ type: ValidationActionType.SetField, field: 'in', isValid: true });
      dispatch({ type: ValidationActionType.SetField, field: 'out', isValid: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-8">
      {isModal && (
        <IdControl
          label={t(EntityFieldsI18nKey.id)}
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          entity={entity}
          names={names}
          isUniqueNameError={isUniqueNameError}
          onChangeEntity={onChangeEntity}
          isFullWidth={isModal}
        />
      )}
      <DialSelectField
        id="translator-in"
        label={t(EntityFieldsI18nKey.translatorIn)}
        placeholder={t(InterfacesI18nKey.SelectType)}
        options={interfaceOptions}
        value={entity.in ?? ''}
        containerClassName={controlClassName}
        disabled={isReadOnlyAdmin}
        onChange={onChangeIn}
        required
      />
      <DialSelectField
        id="translator-out"
        label={t(EntityFieldsI18nKey.translatorOut)}
        placeholder={t(InterfacesI18nKey.SelectType)}
        options={interfaceOptions}
        value={entity.out ?? ''}
        containerClassName={controlClassName}
        disabled={isReadOnlyAdmin}
        onChange={onChangeOut}
        required
      />
      <EndpointControl
        id="baseUrl"
        required
        isModal={isModal}
        isFullWidth={isModal}
        label={t(EntityFieldsI18nKey.baseUrl)}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        endpoint={entity.baseUrl}
        onChange={(baseUrl) => onChangeEntity({ ...entity, baseUrl })}
      />
    </div>
  );
};

export default TranslatorCreateProperties;
