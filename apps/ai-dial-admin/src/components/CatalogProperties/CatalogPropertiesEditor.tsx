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
import { CatalogValuesView } from './models';
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

  if (!schema?.properties || !Object.keys(schema.properties).length) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoCatalogProperties)} />;
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
      {!!errors.length && (
        <div className="flex flex-col mb-2">
          {errors.map((error) => (
            <DialErrorText key={`${error.field}-${error.message}`} text={error.message} />
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {view === CatalogValuesView.Form ? (
          <div className="p-4 bg-layer-0">
            <SchemaUiRenderer
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
