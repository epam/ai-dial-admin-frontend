import { FC } from 'react';

import ToolsetDetails from '@/src/components/Publications/Assets/Toolset/ToolsetDetails';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { ToolsetPublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: ToolsetPublication;
  onChange?: (publication: ToolsetPublication) => void;
}

const ToolsetProperties: FC<Props> = ({ publication, onChange }) => {
  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties
          publication={publication}
          onChange={onChange}
          getContext={useToolsetFolder}
          shouldAbleToCreateNewFolder={false}
        />
        <ToolsetDetails publication={publication} onChange={onChange} />
      </div>
    </div>
  );
};

export default ToolsetProperties;
