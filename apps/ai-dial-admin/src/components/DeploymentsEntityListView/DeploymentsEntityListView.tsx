'use client';
import React, { FC, useCallback, useState } from 'react';
import { DialTabs } from '@epam/ai-dial-ui-kit';

import { ApplicationRoute } from '@/src/types/routes';
import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import ImagesList from '@/src/components/Images/List/ImagesList';
import { getUniqueLatestImages } from '@/src/utils/deployments/images';
import ContainersList from '@/src/components/Containers/List/ContainersList';
import { EntityViewTab, getDeploymentsViewTabs } from '@/src/utils/tabs/utils';

interface Props {
  route: ApplicationRoute;
  images: Image[];
  containers: Container[];
}

const DeploymentsEntityListView: FC<Props> = ({ route, images, containers }) => {
  const t = useI18n();
  const tabs = getDeploymentsViewTabs(route, t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Containers);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        setActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab],
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded relative">
        <div className="flex flex-row min-h-[34px] pt-4 px-6">
          <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        </div>
        <div className="flex flex-col overflow-auto my-3 min-h-0 h-full">
          <>
            {activeTab === EntityViewTab.Images && (
              <ImagesList route={route} imagesList={getUniqueLatestImages(images)} />
            )}
            {activeTab === EntityViewTab.Containers && <ContainersList route={route} containersList={containers} />}
          </>
        </div>
      </div>
    </>
  );
};

export default DeploymentsEntityListView;
