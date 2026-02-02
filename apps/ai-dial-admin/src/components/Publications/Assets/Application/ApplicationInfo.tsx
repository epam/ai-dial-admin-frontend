import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import TopicsControl from '@/src/components/BaseControls/Topics';

interface Props {
  application: DialApplicationResource;
}

const ApplicationInfo: FC<Props> = ({ application }) => {
  return application ? (
    <div className="flex flex-col gap-y-8 w-full">
      <DisplayNameControl disabled={true} displayName={application?.displayName} isFullWidth={false} />
      <DescriptionControl entity={application} disabled={true} isFullWidth={false} />
      <IconControl disabled={true} iconUrl={application.iconUrl} />
      <TopicsControl disabled={true} entity={{ topics: application?.descriptionKeywords }} />
    </div>
  ) : null;
};

export default ApplicationInfo;
