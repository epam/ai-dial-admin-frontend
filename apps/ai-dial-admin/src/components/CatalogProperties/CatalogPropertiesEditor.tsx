'use client';

import {
  DialErrorText,
  DialLoader,
  DialNoDataContent,
  DialSelect,
  JsonSchema,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { CompareI18nKey, EntitiesI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  getUndeclaredCatalogProperties,
  isAdditionalPropertiesForbidden,
} from '@/src/utils/catalog-schemas/validate-properties';
import { CatalogValuesView } from './models';
import UndeclaredPropertiesBanner from './UndeclaredPropertiesBanner';
import { CatalogPropertiesState } from './use-catalog-properties';

interface Props extends CatalogPropertiesState {
  schemaId?: string;
  values?: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

/**
 * The catalog meta-schema's presentation metadata (`dial:tab`, `dial:section`, `dial:propertyOrder`,
 * `dial:widget`) and its `dial:file` marker have no effect here: the shared renderer reads neither,
 * so a file-valued property is edited as the reference string it is, and the JSON view is the escape
 * hatch meanwhile.
 *
 * Read-only state is not threaded in: `SchemaUiRenderer` and `EntityJsonEditor` both read
 * `useIsReadOnlyAdmin` themselves, which `setEntityReadOnly` on a config-file view folds into.
 */
const CatalogPropertiesEditor: FC<Props> = ({
  schemaId,
  schema,
  isLoading,
  hasReadFailed,
  errors,
  values,
  onChange,
}) => {
  const t = useI18n();

  const [view, setView] = useState<CatalogValuesView>(CatalogValuesView.Form);

  // The renderer seeds its own state from `data` once, so it is remounted to forget the removed values
  // rather than write them back on the next edit.
  const [formKey, setFormKey] = useState(0);

  const jsonSchema = useMemo(
    () =>
      ({
        $defs: schema?.$defs,
        properties: schema?.properties,
        required: schema?.required,
        isRoot: true,
      }) as JsonSchema,
    [schema],
  );

  const viewItems = useMemo(
    () => [
      { value: CatalogValuesView.Form, label: t(EntitiesI18nKey.Form) },
      { value: CatalogValuesView.Json, label: t(TypeI18nKey.JSON) },
    ],
    [t],
  );

  const undeclared = useMemo(() => getUndeclaredCatalogProperties(schema, values), [schema, values]);

  // The banner names undeclared values itself, so the error list does not repeat them.
  const otherErrors = useMemo(() => errors.filter((error) => !undeclared.includes(error.field)), [errors, undeclared]);

  const removeUndeclared = useCallback(() => {
    setFormKey((key) => key + 1);
    onChange(Object.fromEntries(Object.entries(values ?? {}).filter(([name]) => !undeclared.includes(name))));
  }, [onChange, undeclared, values]);

  const setValuesFromJson: Dispatch<SetStateAction<Record<string, unknown>>> = useCallback(
    (next: SetStateAction<Record<string, unknown>>) => {
      onChange(typeof next === 'function' ? next(values ?? {}) : next);
    },
    [onChange, values],
  );

  if (!schemaId) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoCatalogSchemaSelected)} />;
  }

  if (isLoading) {
    return <DialLoader size={40} />;
  }

  if (hasReadFailed) {
    return <DialNoDataContent title={t(EntitiesI18nKey.CatalogSchemaUnavailable)} />;
  }

  const undeclaredBanner = !!undeclared.length && (
    <UndeclaredPropertiesBanner
      className="mb-2"
      names={undeclared}
      isForbidden={isAdditionalPropertiesForbidden(schema)}
      onRemove={removeUndeclared}
    />
  );

  // Stored values can still block the save under a schema that declares nothing, so the banner stays.
  if (!schema?.properties || !Object.keys(schema.properties).length) {
    return (
      <div className="flex flex-col size-full">
        {undeclaredBanner}
        <DialNoDataContent title={t(EntitiesI18nKey.NoCatalogProperties)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full">
      <div className="flex flex-row mb-2">
        <DialSelect
          elementId="catalogValuesView"
          prefix={`${t(CompareI18nKey.View)}: `}
          size={SelectSize.Sm}
          variant={SelectVariant.Secondary}
          options={viewItems}
          value={view}
          onChange={(value) => setView(value as CatalogValuesView)}
        />
      </div>
      {undeclaredBanner}
      {!!otherErrors.length && (
        <div className="flex flex-col mb-2">
          {otherErrors.map((error) => (
            <DialErrorText key={`${error.field}-${error.message}`} text={error.message} />
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {view === CatalogValuesView.Form ? (
          <div className="p-4 bg-layer-0">
            <SchemaUiRenderer
              key={formKey}
              schema={jsonSchema}
              data={values}
              onChangeConfiguration={onChange}
              defaultExpanded={false}
            />
          </div>
        ) : (
          <EntityJsonEditor entity={values ?? {}} setSelectedEntity={setValuesFromJson} />
        )}
      </div>
    </div>
  );
};

export default CatalogPropertiesEditor;
