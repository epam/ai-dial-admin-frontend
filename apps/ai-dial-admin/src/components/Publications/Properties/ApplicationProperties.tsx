import { FC } from 'react';

import ApplicationDetails from '@/src/components/Publications/Assets/Application/ApplicationDetails';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationPublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: ApplicationPublication;
  onChange?: (publication: ApplicationPublication) => void;
  applicationSchemes?: DialApplicationScheme[];
}

const ApplicationProperties: FC<Props> = ({ publication, onChange, applicationSchemes }) => {
  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties
          publication={publication}
          onChange={onChange}
          getContext={useAppsFolder}
          shouldAbleToCreateNewFolder={false}
        />
        <ApplicationDetails publication={publication} onChange={onChange} applicationSchemes={applicationSchemes} />
      </div>
    </div>
  );
};

export default ApplicationProperties;
