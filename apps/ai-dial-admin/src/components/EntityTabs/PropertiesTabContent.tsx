'use client';

import { ReactNode } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { ApplicationRoute } from '@/src/types/routes';

export interface PropertiesProps<T> {
  id?: string;
  entity: T;
  view: ApplicationRoute;
  children: ReactNode;
  headerPostfix?: ReactNode;
  headerPrefix?: ReactNode;
}

const PropertiesTabContent = <T extends object>({ children, ...props }: PropertiesProps<T>) => {
  return (
    <div className="flex flex-col">
      <EntityInfoHeader {...props} />

      <div className="flex-1 min-h-0 pt-8">{children}</div>
    </div>
  );
};

export default PropertiesTabContent;
