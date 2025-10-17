import { FC, useEffect, useState } from 'react';
import { DialTabs } from '@epam/ai-dial-ui-kit';

import ApplicationParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import FilesProperties from '@/src/components/Publications/Assets/Files/FilesProperties';

import { useI18n } from '@/src/locales/client';
import { ApplicationPublication } from '@/src/models/dial/publications';
import ApplicationInfo from './ApplicationInfo';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, parametersTabs, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { TabsI18nKey } from '@/src/constants/i18n';

interface Props {
  publication: ApplicationPublication;
}

const ApplicationProperties: FC<Props> = ({ publication }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [propertiesTabs(t), parametersTabs(t), { id: EntityViewTab.Files, name: t(TabsI18nKey.Files) }];
  const application = publication.applicationResources?.[0];
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  useEffect(() => {
    const permissionContent = document.getElementById('publication-permissions');
    if (selectedTab === EntityViewTab.Properties) {
      permissionContent?.classList.remove('hidden');
    } else {
      permissionContent?.classList.add('hidden');
    }
  }, [selectedTab]);

  return application ? (
    <div className="flex flex-col gap-y-6 h-full">
      <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab as EntityViewTab)} />
      <div className="flex-1 min-h-0 pt-[25px] lg:pt-0">
        {selectedTab === EntityViewTab.Properties && <ApplicationInfo application={application} />}
        {selectedTab === EntityViewTab.Parameters && (
          <ApplicationParametersTab entity={application} view={ApplicationRoute.ApplicationPublications} />
        )}
        {selectedTab === EntityViewTab.Files && <FilesProperties publication={publication} />}
      </div>
    </div>
  ) : null;
};

export default ApplicationProperties;
