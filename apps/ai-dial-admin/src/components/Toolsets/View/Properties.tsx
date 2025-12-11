'use client';

import { FC } from 'react';

import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';

interface Props {
  selectedToolset: Toolset;
  names: string[];
  onChangeToolset: (toolset: Toolset) => void;
}

const ToolsetProperties: FC<Props> = ({ names, selectedToolset, onChangeToolset }) => {
  return (
    <div className="w-full flex flex-col">
      <EntityHeader entity={selectedToolset} />
      <div className="flex-1 min-h-0 pt-8 gap-y-8 flex flex-col">
        <DeploymentProperties
          entity={selectedToolset}
          onChangeEntity={onChangeToolset}
          names={names}
          isEntityImmutable={true}
          view={ApplicationRoute.Toolsets}
        />
        <MaxRetryAttempts entity={selectedToolset} onChangeEntity={onChangeToolset} />
      </div>
    </div>
  );
};

export default ToolsetProperties;
