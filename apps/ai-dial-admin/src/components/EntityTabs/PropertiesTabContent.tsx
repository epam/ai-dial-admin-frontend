'use client';

import { ReactNode } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { ApplicationRoute } from '@/src/types/routes';

interface Props<T> {
  id?: string;
  entity: T;
  view: ApplicationRoute;
  children: ReactNode;
  headerPostfix?: ReactNode;
  headerPrefix?: ReactNode;
}

const PropertiesTabContent = <T extends object>({ children, headerPrefix, headerPostfix, ...props }: Props<T>) => {
  return (
    <div className="flex flex-col">
      <EntityInfoHeader prefix={headerPrefix} postfix={headerPostfix} {...props} />

      <div className="flex-1 min-h-0 pt-8">{children}</div>
    </div>
  );
};

export default PropertiesTabContent;
