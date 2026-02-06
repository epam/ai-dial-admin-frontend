'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { DialRoute } from '@/src/models/dial/route';
import RouteProperties from './RouteProperties';
import { ApplicationRoute } from '@/src/types/routes';

export interface PropertiesProps {
  route: DialRoute;
  routeNames: string[];
  onChangeRoute: (route: DialRoute) => void;
}

const PropertiesTabContent: FC<PropertiesProps> = ({ route, routeNames, onChangeRoute }) => {
  return (
    <div className="h-full flex flex-col w-full">
      <EntityInfoHeader id={route.name} entity={route} view={ApplicationRoute.Routes} />
      <div className="flex-1 min-h-0 pt-8">
        <RouteProperties route={route} onChange={onChangeRoute} routeNames={routeNames} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
