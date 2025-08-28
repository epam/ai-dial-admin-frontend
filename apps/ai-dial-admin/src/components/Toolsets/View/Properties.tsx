'use client';

import { FC } from 'react';

import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { DialToolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import MaintainerControl from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';

interface Props {
  selectedToolset: DialToolset;
  names: string[];
  onChangeToolset: (toolset: DialToolset) => void;
}

const ToolsetProperties: FC<Props> = ({ names, selectedToolset, onChangeToolset }) => {
  return (
    <div className="pt-3 w-full lg:w-[35%]">
      <EntityHeader entity={selectedToolset} />
      <div className="flex-1 min-h-0 pt-4 flex flex-col">
        <EntityMainProperties
          entity={selectedToolset}
          onChangeEntity={onChangeToolset}
          names={names}
          view={ApplicationRoute.Toolsets}
        />
        <MaintainerControl entity={selectedToolset} onChangeEntity={onChangeToolset} />
        <EntityIcon entity={selectedToolset} onChangeEntity={onChangeToolset} />
      </div>
    </div>
  );
};

export default ToolsetProperties;
