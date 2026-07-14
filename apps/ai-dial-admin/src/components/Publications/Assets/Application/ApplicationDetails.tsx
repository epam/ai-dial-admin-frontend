import { FC, useCallback } from 'react';

import ApplicationAssetProperties from '@/src/components/Assets/Apps/Properties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ApplicationPublication } from '@/src/models/dial/publications';
import { updatePathWithNameAndVersion } from '@/src/utils/files/path';

interface Props {
  publication: ApplicationPublication;
  applicationSchemes?: DialApplicationScheme[];
  onChange?: (publication: ApplicationPublication) => void;
}

const ApplicationDetails: FC<Props> = ({ publication, applicationSchemes, onChange }) => {
  const onChangeApplication = useCallback(
    (updatedApplication: DialApplicationResource) => {
      const path = updatePathWithNameAndVersion(
        updatedApplication.path,
        updatedApplication.name || '',
        updatedApplication.version,
      );
      const updatedApplications = [...(publication.applicationResources || [])];
      updatedApplications[0] = {
        ...updatedApplications[0],
        applicationResource: { ...updatedApplication, path } as unknown as DialApplicationResource,
      };
      onChange?.({ ...publication, applicationResources: updatedApplications });
    },
    [publication, onChange],
  );
  return (
    <div className="flex flex-col gap-y-8 h-full">
      <ApplicationAssetProperties
        asset={publication.applicationResources?.[0].applicationResource as unknown as DialApplicationResource}
        onChange={onChangeApplication}
        runners={applicationSchemes}
        isPublication
      />
    </div>
  );
};

export default ApplicationDetails;
