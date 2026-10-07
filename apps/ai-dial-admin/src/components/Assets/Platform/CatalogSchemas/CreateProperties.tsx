'use client';

import { FC, useCallback, useEffect, useMemo } from 'react';

import { DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { CATALOG_DEFAULT_LOCALE_PATTERN, OFFERED_CATALOG_ENTITY_TYPES } from '@/src/constants/catalog-schemas';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/core-schemas/constants';
import { getControlClassName } from '@/src/utils/entities/view';
import { startCase } from 'lodash';

interface Props {
  entity: DialCatalogSchemaResource;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
  /** False on the details view, where the `$id` is Core's resource name: shown, but read-only. */
  isModal?: boolean;
}

/** Shared by the create modal and the details-view Properties tab. */
const CatalogSchemaCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity, isModal }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const controlClassName = getControlClassName(isModal);

  const declaredEntityType = entity['dial:catalogEntityType'];

  /**
   * The offered four, plus the kind this schema already declares when that is not among them. A
   * configuration file may legally type a schema `skill`, which the save gate still accepts — so
   * the field has to show that value rather than render blank and discard it on the next edit.
   */
  const entityTypeOptions = useMemo(() => {
    const offered =
      declaredEntityType && !OFFERED_CATALOG_ENTITY_TYPES.includes(declaredEntityType)
        ? [...OFFERED_CATALOG_ENTITY_TYPES, declaredEntityType]
        : OFFERED_CATALOG_ENTITY_TYPES;

    return offered.map((type) => ({ value: type, label: startCase(type) }));
  }, [declaredEntityType]);

  const defaultLocale = entity['dial:defaultLocale'];
  const localeError =
    defaultLocale && !CATALOG_DEFAULT_LOCALE_PATTERN.test(defaultLocale) ? t(ErrorI18nKey.LocaleField) : undefined;

  const onChangeEntityType = useCallback(
    (value: string | string[]) => {
      const entityType = value as CatalogEntityType;
      onChangeEntity({ ...entity, 'dial:catalogEntityType': entityType });
      dispatch({ type: ValidationActionType.SetField, field: 'catalogEntityType', isValid: !!entityType });
    },
    [entity, onChangeEntity, dispatch],
  );

  const onChangeDefaultLocale = useCallback(
    (locale?: string) => {
      onChangeEntity({ ...entity, 'dial:defaultLocale': locale });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'catalogDefaultLocale',
        isValid: !locale || CATALOG_DEFAULT_LOCALE_PATTERN.test(locale),
      });
    },
    [entity, onChangeEntity, dispatch],
  );

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'catalogEntityType',
      isValid: !!entity['dial:catalogEntityType'],
    });

    return () => {
      dispatch({ type: ValidationActionType.SetField, field: 'catalogEntityType', isValid: true });
      dispatch({ type: ValidationActionType.SetField, field: 'catalogDefaultLocale', isValid: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-8">
      <IdControl
        label={t(EntityFieldsI18nKey.name)}
        inputId="name"
        validationField="name"
        names={names}
        isUniqueNameError={isUniqueNameError}
        entity={{ name: entity.name }}
        isFullWidth={isModal}
        disabled={!isModal}
        onChangeEntity={({ name }) => onChangeEntity({ ...entity, name })}
      />

      <IdControl
        inputId="schema-id"
        validationField="schemaId"
        label={t(EntityFieldsI18nKey.id)}
        names={[]}
        isUrlId
        forbiddenChars={CORE_UNENCODABLE_ID_CHARS}
        isUniqueNameError={isUniqueNameError}
        entity={{ name: entity.$id }}
        disabled={!isModal}
        isFullWidth={isModal}
        onChangeEntity={({ name }) => onChangeEntity({ ...entity, $id: name })}
      />
      <DialSelectField
        id="catalog-entity-type"
        label={t(EntityFieldsI18nKey.catalogEntityType)}
        placeholder={t(EntityPlaceholdersI18nKey.SelectCatalogEntityType)}
        options={entityTypeOptions}
        value={declaredEntityType ?? ''}
        containerClassName={controlClassName}
        disabled={isReadOnlyAdmin}
        onChange={onChangeEntityType}
        required
      />
      <DisplayNameControl
        displayName={entity['dial:catalogDisplayName']}
        required
        isFullWidth={isModal}
        onChange={(displayName?: string) => onChangeEntity({ ...entity, 'dial:catalogDisplayName': displayName })}
      />
      <DialInput
        id="catalog-default-locale"
        labelProps={{ label: t(EntityFieldsI18nKey.catalogDefaultLocale) }}
        placeholder={t(EntityPlaceholdersI18nKey.CatalogDefaultLocale)}
        value={defaultLocale ?? ''}
        containerClassName={controlClassName}
        disabled={isReadOnlyAdmin}
        error={localeError}
        invalid={!!localeError}
        onChange={onChangeDefaultLocale}
      />
    </div>
  );
};

export default CatalogSchemaCreateProperties;
