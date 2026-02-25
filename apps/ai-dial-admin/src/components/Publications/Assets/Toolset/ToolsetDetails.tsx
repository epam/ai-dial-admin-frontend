import { FC, useCallback } from 'react';

import Properties from '@/src/components/Assets/Toolsets/View/Properties/Properties';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ToolsetPublication } from '@/src/models/dial/publications';
import { updatePathWithNameAndVersion } from '@/src/utils/files/path';

interface Props {
  publication: ToolsetPublication;
  onChange?: (publication: ToolsetPublication) => void;
}

const ToolsetDetails: FC<Props> = ({ publication, onChange }) => {
  const onChangeToolset = useCallback(
    (updatedToolset: DeploymentAsset) => {
      const path = updatePathWithNameAndVersion(updatedToolset.path, updatedToolset.name || '', updatedToolset.version);
      const updatedToolsets = [...(publication.toolSetResources || [])];
      updatedToolsets[0] = {
        ...updatedToolsets[0],
        toolSetResource: { ...updatedToolset, path } as unknown as DialApplicationResource,
      };
      onChange?.({ ...publication, toolSetResources: updatedToolsets });
    },
    [publication, onChange],
  );
  return (
    <div className="flex flex-col gap-y-8 h-full">
      <Properties
        selectedToolset={publication.toolSetResources?.[0].toolSetResource as unknown as DeploymentAsset}
        onChange={onChangeToolset}
        isPublication
      />
    </div>
  );
};

export default ToolsetDetails;
