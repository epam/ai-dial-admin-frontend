import { FC, useEffect, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import ParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import FilesProperties from '@/src/components/Publications/Assets/Files/FilesProperties';

import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationPublication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getPublicationTabs } from '@/src/utils/tabs/utils';
import ApplicationInfo from './ApplicationInfo';

interface Props {
  publication: ApplicationPublication;
  applicationSchemes?: DialApplicationScheme[] | null;
}

const ApplicationProperties: FC<Props> = ({ publication, applicationSchemes }) => {
  const t = useI18n();
  const tabs = getPublicationTabs(t);
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
    <div className="flex flex-col gap-y-8 h-full">
      <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab as EntityViewTab)} />
      <div className="flex-1 min-h-0 pt-[25px] lg:pt-0">
        {selectedTab === EntityViewTab.Properties && <ApplicationInfo application={application} />}
        {selectedTab === EntityViewTab.Parameters && (
          <ParametersTab
            application={application}
            view={ApplicationRoute.ApplicationPublications}
            applicationSchemes={applicationSchemes}
          />
        )}
        {selectedTab === EntityViewTab.Files && <FilesProperties publication={publication} />}
      </div>
    </div>
  ) : null;
};

export default ApplicationProperties;
