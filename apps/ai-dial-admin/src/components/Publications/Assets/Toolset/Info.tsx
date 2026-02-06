import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import { DialToolsetResource } from '@/src/models/dial/application-resource';
import TopicsControl from '@/src/components/BaseControls/Topics';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import Authentication from '@/src/components/Toolsets/Auth/Authentication';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  toolset: DialToolsetResource;
}

const ToolsetInfo: FC<Props> = ({ toolset }) => {
  return toolset ? (
    <div className="flex flex-col gap-y-8 w-full">
      <DisplayNameControl disabled={true} displayName={toolset?.displayName} isFullWidth={false} />
      <DescriptionControl entity={toolset} disabled={true} isFullWidth={false} />
      <IconControl disabled={true} iconUrl={toolset.iconUrl} />
      <TopicsControl disabled={true} entity={{ topics: toolset?.descriptionKeywords }} />
      <ToolsetEndpoint disabled={true} entity={toolset} />
      <Authentication disabled={true} toolset={toolset} view={ApplicationRoute.AssetsToolsets} />
    </div>
  ) : null;
};

export default ToolsetInfo;
