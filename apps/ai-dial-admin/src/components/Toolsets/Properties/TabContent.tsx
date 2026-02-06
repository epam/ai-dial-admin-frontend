'use client';

import { FC, useMemo } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { AuthHeader } from '@/src/components/Toolsets/Auth/Sections/AuthHeader';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import ToolsetProperties from './Properties';

export interface PropertiesProps {
  selectedToolset: Toolset;
  names: string[];
  onChange: (toolset: Toolset) => void;
}

const PropertiesTabContent: FC<PropertiesProps> = ({ selectedToolset, names, onChange }) => {
  const headerPostfix = useMemo(() => {
    return <AuthHeader toolset={selectedToolset} />;
  }, [selectedToolset]);

  return (
    <div className="flex flex-col">
      <EntityInfoHeader
        id={selectedToolset.name}
        entity={selectedToolset}
        view={ApplicationRoute.Toolsets}
        postfix={headerPostfix}
      />

      <div className="flex-1 min-h-0 pt-8">
        <ToolsetProperties selectedToolset={selectedToolset} onChangeToolset={onChange} names={names} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
