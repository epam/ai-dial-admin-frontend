'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import InterceptorProperties from './Properties';
import { ApplicationRoute } from '@/src/types/routes';

export interface PropertiesProps {
  names: string[];
  selectedInterceptor: DialInterceptor;
  onChange: (interceptor: DialInterceptor) => void;
}

const PropertiesTabContent: FC<PropertiesProps> = ({ selectedInterceptor, onChange, names }) => {
  return (
    <div className="h-full flex flex-col w-full">
      <EntityInfoHeader
        id={selectedInterceptor.name}
        entity={selectedInterceptor}
        view={ApplicationRoute.Interceptors}
      />
      <div className="flex-1 min-h-0 pt-8">
        <InterceptorProperties selectedInterceptor={selectedInterceptor} onChangeInterceptor={onChange} names={names} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
