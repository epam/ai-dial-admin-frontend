import { FC, useEffect, useState } from 'react';

import ApplicationParametersTab from '@/src/components/ApplicationParametersTab/ApplicationParametersTab';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationPublication } from '@/src/models/dial/publications';
import ApplicationInfo from './ApplicationInfo';
import FilesProperties from '../FileProperties/FilesProperties';

enum ApplicationPublicationTab {
  Properties = 'Properties',
  Parameters = 'Parameters',
  Files = 'Files',
}
interface Props {
  publication: ApplicationPublication;
}

const ApplicationProperties: FC<Props> = ({ publication }) => {
  const t = useI18n();
  const tabs = [
    { id: ApplicationPublicationTab.Properties, name: t(TabsI18nKey.Properties) },
    { id: ApplicationPublicationTab.Parameters, name: t(TabsI18nKey.Parameters) },
    { id: ApplicationPublicationTab.Files, name: t(TabsI18nKey.Files) },
  ];
  const application = publication.applicationResources?.[0];
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  useEffect(() => {
    const permissionContent = document.getElementById('publication-permissions');
    if (selectedTab === ApplicationPublicationTab.Properties) {
      permissionContent?.classList.remove('hidden');
    } else {
      permissionContent?.classList.add('hidden');
    }
  }, [selectedTab]);

  return application ? (
    <div className="flex flex-col gap-y-6 h-full">
      <Tabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab as ApplicationPublicationTab)} />
      <div className="flex-1 min-h-0 pt-[25px] lg:pt-0 lg:w-[35%]">
        {selectedTab === ApplicationPublicationTab.Properties && <ApplicationInfo application={application} />}
        {selectedTab === ApplicationPublicationTab.Parameters && <ApplicationParametersTab entity={application} />}
        {selectedTab === ApplicationPublicationTab.Files && <FilesProperties publication={publication} />}
      </div>
    </div>
  ) : null;
};

export default ApplicationProperties;
