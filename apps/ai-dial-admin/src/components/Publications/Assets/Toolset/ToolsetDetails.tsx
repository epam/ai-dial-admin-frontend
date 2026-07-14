import { FC, useCallback } from 'react';

import ToolsetAssetProperties from '@/src/components/Assets/Toolsets/View/Properties';
import { ToolsetPublication } from '@/src/models/dial/publications';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { updatePathWithNameAndVersion } from '@/src/utils/files/path';

interface Props {
  publication: ToolsetPublication;
  onChange?: (publication: ToolsetPublication) => void;
}

const ToolsetDetails: FC<Props> = ({ publication, onChange }) => {
  const onChangeToolset = useCallback(
    (updatedToolset: DialToolsetResource) => {
      const path = updatePathWithNameAndVersion(updatedToolset.path, updatedToolset.name || '', updatedToolset.version);
      const updatedToolsets = [...(publication.toolSetResources || [])];
      updatedToolsets[0] = {
        ...updatedToolsets[0],
        toolSetResource: { ...updatedToolset, path },
      };
      onChange?.({ ...publication, toolSetResources: updatedToolsets });
    },
    [publication, onChange],
  );
  return (
    <div className="flex flex-col gap-y-8 h-full">
      <ToolsetAssetProperties
        selectedToolset={publication.toolSetResources?.[0].toolSetResource as DialToolsetResource}
        onChange={onChangeToolset}
        isPublication
      />
    </div>
  );
};

export default ToolsetDetails;
