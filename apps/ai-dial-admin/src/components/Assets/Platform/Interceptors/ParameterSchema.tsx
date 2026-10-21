'use client';

import { FC } from 'react';

import { getInterceptorConfigurationSchema } from '@/src/app/[lang]/platform-interceptors/actions';
import ParameterSchema from '@/src/components/Interceptors/View/ParameterSchema/ParameterSchema';
import { DialInterceptorResource } from '@/src/models/dial/resource';

interface Props {
  selectedInterceptor: DialInterceptorResource;
  onChangeConfiguration: (data: Record<string, unknown>) => void;
}

/**
 * Reuses the entity-side `ParameterSchema` component, overriding its default admin-BE schema lookup
 * with a Core-direct one (`getInterceptorConfigurationSchema`, `v1/deployments/{name}/configuration`)
 * — the interceptor's plain Core name resolves there without any admin-BE row.
 */
const InterceptorAssetParameterSchema: FC<Props> = ({ selectedInterceptor, onChangeConfiguration }) => {
  return (
    <ParameterSchema
      schemaURL={selectedInterceptor.features?.configuration_endpoint}
      name={selectedInterceptor.name}
      configuration={
        (selectedInterceptor.defaults?.custom_fields as Record<string, Record<string, unknown>>)?.[
          'interceptor_configuration'
        ]
      }
      onChangeConfiguration={onChangeConfiguration}
      getSchema={getInterceptorConfigurationSchema}
    />
  );
};

export default InterceptorAssetParameterSchema;
