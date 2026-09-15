'use client';

import { FC, useCallback } from 'react';

import CatalogPropertiesEditor from '@/src/components/CatalogProperties/CatalogPropertiesEditor';
import { useCatalogProperties } from '@/src/components/CatalogProperties/use-catalog-properties';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import InterceptorAssetParameterSchema from './ParameterSchema';
import InterceptorAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedInterceptor: DialInterceptorResource;
  catalogSchemas?: CatalogSchemaOptions;
  onChange: (interceptor: DialInterceptorResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedInterceptor, catalogSchemas, onChange }) => {
  const catalogProperties = useCatalogProperties(
    selectedInterceptor.catalogSchemaId,
    selectedInterceptor.catalogProperties,
  );

  const onChangeConfiguration = useCallback(
    (data: Record<string, unknown>) => {
      onChange({
        ...selectedInterceptor,
        defaults: {
          ...selectedInterceptor.defaults,
          custom_fields: {
            interceptor_configuration: data,
          },
        },
      });
    },
    [onChange, selectedInterceptor],
  );

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <InterceptorAssetProperties asset={selectedInterceptor} catalogSchemas={catalogSchemas} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.ParameterSchema && (
        <InterceptorAssetParameterSchema
          selectedInterceptor={selectedInterceptor}
          onChangeConfiguration={onChangeConfiguration}
        />
      )}
      {activeTab === EntityViewTab.Catalog && (
        <CatalogPropertiesEditor
          {...catalogProperties}
          schemaId={selectedInterceptor.catalogSchemaId}
          values={selectedInterceptor.catalogProperties}
          onChange={(catalogProperties) => onChange({ ...selectedInterceptor, catalogProperties })}
        />
      )}
    </>
  );
};

export default TabsContent;
