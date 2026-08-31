'use client';

import { FC, useCallback } from 'react';

import { DialInterceptorResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import InterceptorAssetParameterSchema from './ParameterSchema';
import InterceptorAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedInterceptor: DialInterceptorResource;
  onChange: (interceptor: DialInterceptorResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedInterceptor, onChange }) => {
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
        <InterceptorAssetProperties asset={selectedInterceptor} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.ParameterSchema && (
        <InterceptorAssetParameterSchema
          selectedInterceptor={selectedInterceptor}
          onChangeConfiguration={onChangeConfiguration}
        />
      )}
    </>
  );
};

export default TabsContent;
