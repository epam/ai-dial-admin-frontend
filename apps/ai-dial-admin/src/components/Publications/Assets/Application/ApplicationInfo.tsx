import { FC } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';

interface Props {
  application: DialApplicationResource;
}

const ApplicationInfo: FC<Props> = ({ application }) => {
  return application ? (
    <div className="flex flex-col gap-y-8 w-full">
      <div className="flex flex-col gap-y-8 w-full lg:w-[35%]">
        <DisplayNameControl disabled={true} displayName={application?.displayName} />
        <DescriptionControl entity={application} disabled={true} />
        <IconControl disabled={true} iconUrl={application.iconUrl} />
      </div>
      <TopicsControl disabled={true} entity={{ topics: application?.descriptionKeywords }} />
    </div>
  ) : null;
};

export default ApplicationInfo;
