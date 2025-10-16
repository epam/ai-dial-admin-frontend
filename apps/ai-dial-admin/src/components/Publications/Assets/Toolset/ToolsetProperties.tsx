import { FC, useEffect, useState } from 'react';

import Tabs from '@/src/components/Common/Tabs/Tabs';
import { EntityViewTab, propertiesTabs, toolsTabs } from '@/src/components/EntityView/View/utils';
import Tool from '@/src/components/Toolsets/Tools/Tools';
import { useI18n } from '@/src/locales/client';
import { ToolsetPublication } from '@/src/models/dial/publications';
import ToolsetInfo from './Info';

interface Props {
  publication: ToolsetPublication;
}

const ToolsProperties: FC<Props> = ({ publication }) => {
  const t = useI18n() as (s: string) => string;
  const tabs = [propertiesTabs(t), toolsTabs(t)];
  const toolset = publication.toolSetResources?.[0];
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  useEffect(() => {
    const permissionContent = document.getElementById('publication-permissions');
    if (selectedTab === EntityViewTab.Properties) {
      permissionContent?.classList.remove('hidden');
    } else {
      permissionContent?.classList.add('hidden');
    }
  }, [selectedTab]);

  return toolset ? (
    <div className="flex flex-col gap-y-6 h-full">
      <Tabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab as EntityViewTab)} />
      <div className="flex-1 min-h-0 pt-[25px] lg:pt-0">
        {selectedTab === EntityViewTab.Properties && <ToolsetInfo toolset={toolset} />}
        {selectedTab === EntityViewTab.Tools && <Tool originalToolset={toolset} />}
      </div>
    </div>
  ) : null;
};

export default ToolsProperties;
