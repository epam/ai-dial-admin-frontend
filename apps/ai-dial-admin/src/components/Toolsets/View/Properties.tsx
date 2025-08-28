'use client';

import { FC } from 'react';

import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { DialToolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';

interface Props {
  selectedToolset: DialToolset;
  names: string[];
  onChangeToolset: (toolset: DialToolset) => void;
}

const ToolsetProperties: FC<Props> = ({ names, selectedToolset, onChangeToolset }) => {
  return (
    <div className="pt-3 w-full">
      <EntityHeader entity={selectedToolset} />
      <div className="flex-1 min-h-0 pt-4 flex flex-col">
        <EntityMainProperties
          entity={selectedToolset}
          onChangeEntity={onChangeToolset}
          names={names}
          isEntityImmutable={true}
          view={ApplicationRoute.Toolsets}
        />
        <div className="flex flex-col gap-y-6 lg:w-[35%] mt-6">
          <IconControl
            iconUrl={selectedToolset.iconUrl}
            onChange={(icon) => onChangeToolset({ ...selectedToolset, iconUrl: icon })}
          />
          <TopicsControl entity={selectedToolset} onChange={onChangeToolset} />
          <MaxRetryAttempts entity={selectedToolset} onChange={onChangeToolset} />
        </div>
      </div>
    </div>
  );
};

export default ToolsetProperties;
