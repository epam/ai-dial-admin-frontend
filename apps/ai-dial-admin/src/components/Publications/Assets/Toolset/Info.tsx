import { FC } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import { DialToolsetResource } from '@/src/models/dial/application-resource';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';

interface Props {
  toolset: DialToolsetResource;
}

const ToolsetInfo: FC<Props> = ({ toolset }) => {
  return toolset ? (
    <div className="flex flex-col gap-y-6 w-full lg:w-[35%]">
      <DisplayNameControl readonly={true} displayName={toolset?.displayName} />
      <DescriptionControl entity={toolset} readonly={true} />

      <IconControl readonly={true} iconUrl={toolset.iconUrl} />
      <TopicsControl readonly={true} entity={{ topics: toolset?.descriptionKeywords }} />
      <ToolsetEndpoint readonly={true} entity={toolset} />
    </div>
  ) : null;
};

export default ToolsetInfo;
