'use client';

import { FC } from 'react';

import { DialAdapter } from '@/src/models/dial/adapter';
import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import AdapterProperties from './Properties';

interface Props {
  selectedAdapter: DialAdapter;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const PropertiesTabContent: FC<Props> = ({ selectedAdapter, onChangeAdapter }) => {
  return (
    <div className="flex flex-col">
      <EntityInfoHeader id={selectedAdapter.name} entity={selectedAdapter} />
      <div className="flex-1 min-h-0 pt-8">
        <AdapterProperties entity={selectedAdapter} onChangeAdapter={onChangeAdapter} isEntityImmutable={true} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
