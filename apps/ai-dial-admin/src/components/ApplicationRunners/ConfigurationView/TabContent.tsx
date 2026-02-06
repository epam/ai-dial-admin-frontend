'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { DialApplicationScheme } from '@/src/models/dial/application';
import SchemeProperties from './Properties';

export interface PropertiesProps {
  selectedRunner: DialApplicationScheme;
  names: string[];
  onChange: (runner: DialApplicationScheme) => void;
}

const PropertiesTabContent: FC<PropertiesProps> = ({ selectedRunner, names, onChange }) => {
  return (
    <div className="h-full flex flex-col w-full">
      <EntityInfoHeader id={selectedRunner.$id} entity={selectedRunner} />
      <div className="flex-1 min-h-0 pt-8">
        <SchemeProperties names={names} runner={selectedRunner} isImmutable={true} onChangeRunner={onChange} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
