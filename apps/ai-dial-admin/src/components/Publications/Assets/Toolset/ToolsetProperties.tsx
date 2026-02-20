import { DialTabs } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import Tools from '@/src/components/Tools/Tools';
import { useI18n } from '@/src/locales/client';
import { ToolsetPublication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import ToolsetInfo from './Info';

interface Props {
  publication: ToolsetPublication;
}

const ToolsProperties: FC<Props> = ({ publication }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsToolsets);
  const toolset = publication.toolSetResources?.[0]?.toolSetResource;
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
    <div className="flex flex-col gap-y-8 h-full">
      <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab as EntityViewTab)} />
      <div className="flex-1 min-h-0 pt-[25px] lg:pt-0">
        {selectedTab === EntityViewTab.Properties && <ToolsetInfo toolset={toolset} />}
        {selectedTab === EntityViewTab.Tools && (
          <Tools originalToolset={toolset} readonly={true} isAssetToolset={true} />
        )}
      </div>
    </div>
  ) : null;
};

export default ToolsProperties;
