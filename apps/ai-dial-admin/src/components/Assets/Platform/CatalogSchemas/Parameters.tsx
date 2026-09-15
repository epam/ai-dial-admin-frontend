'use client';

import { FC, useCallback, useMemo, useRef } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import { CATALOG_SCHEMA_META_COLUMNS } from '@/src/components/Common/SchemaGrid/constants';
import SchemaGrid from '@/src/components/Common/SchemaGrid/SchemaGrid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { CatalogSchemaProps } from './models';

interface Props extends CatalogSchemaProps {
  isSkipRefresh?: boolean;
}

/**
 * A catalog schema declares no external schema endpoint, so there is nothing to resolve: the schema
 * as loaded is the parameter set, and it is always editable.
 */
const CatalogSchemaParameters: FC<Props> = ({ schema, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const onChangeSchema = useCallback(
    (updated: JSONSchema7, skipRefresh?: boolean) => {
      const current = schemaRef.current;
      if (!current) return;
      const merged = { ...current, ...(updated as unknown as DialCatalogSchemaResource) };
      if (!('required' in (updated as object))) {
        delete merged.required;
      }
      onChange(merged, skipRefresh);
    },
    [onChange],
  );

  const isNoData = useMemo(() => !schema?.properties || !Object.keys(schema.properties).length, [schema]);

  return (
    <div className="flex flex-col size-full">
      {isNoData ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
      ) : (
        <SchemaGrid
          schema={schema as unknown as JSONSchema7}
          onChange={onChangeSchema}
          isSkipRefresh={isSkipRefresh}
          metaColumns={CATALOG_SCHEMA_META_COLUMNS}
        />
      )}
    </div>
  );
};

export default CatalogSchemaParameters;
