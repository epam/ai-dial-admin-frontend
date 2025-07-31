import { FC } from 'react';
import { ApplicationRoute } from '@/src/types/routes';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationProperties from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationProperties';
import PromptsPropertiesList from '@/src/components/PublicationView/PromptProperties/PromptsPropertiesList';
import FilesProperties from '@/src/components/PublicationView/FileProperties/FilesProperties';
import ApplicationProperties from '@/src/components/PublicationView/ApplicationProperties/ApplicationProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  view: ApplicationRoute;
  publication: Publication;
  applicationSchemes?: DialApplicationScheme[] | null;
}

const PublicationProperties: FC<Props> = ({ view, publication, applicationSchemes }) => {
  if (view === ApplicationRoute.PromptPublications) {
    return (
      <BasePublicationProperties publication={publication}>
        <PromptsPropertiesList publication={publication} />
      </BasePublicationProperties>
    );
  }
  if (view === ApplicationRoute.FilePublications) {
    return (
      <BasePublicationProperties publication={publication}>
        <FilesProperties publication={publication} />
      </BasePublicationProperties>
    );
  }

  if (view === ApplicationRoute.ApplicationPublications) {
    return (
      <BasePublicationProperties publication={publication} applicationSchemes={applicationSchemes || []}>
        <ApplicationProperties publication={publication} />
      </BasePublicationProperties>
    );
  }
  return null;
};

export default PublicationProperties;
