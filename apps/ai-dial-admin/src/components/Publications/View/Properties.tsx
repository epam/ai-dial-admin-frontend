import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationProperties from '@/src/components/Publications/Properties/Properties';
import ApplicationProperties from '@/src/components/Publications/Assets/Application/ApplicationProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import ToolsetProperties from '@/src/components/Publications/Assets/Toolset/ToolsetProperties';

interface Props {
  view: ApplicationRoute;
  publication: Publication;
  applicationSchemes?: DialApplicationScheme[] | null;
}

const PublicationProperties: FC<Props> = ({ view, publication, applicationSchemes }) => {
  if (view === ApplicationRoute.ApplicationPublications) {
    return (
      <BasePublicationProperties view={view} publication={publication} applicationSchemes={applicationSchemes || []}>
        <ApplicationProperties publication={publication} applicationSchemes={applicationSchemes || []} />
      </BasePublicationProperties>
    );
  }

  if (view === ApplicationRoute.ToolsetPublications) {
    return (
      <BasePublicationProperties view={view} publication={publication}>
        <ToolsetProperties publication={publication} />
      </BasePublicationProperties>
    );
  }
  return null;
};

export default PublicationProperties;
