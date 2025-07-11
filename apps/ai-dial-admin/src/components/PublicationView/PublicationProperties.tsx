import { FC } from 'react';
import { ApplicationRoute } from '@/src/types/routes';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationProperties from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationProperties';
import PromptsPropertiesList from '@/src/components/PublicationView/PromptProperties/PromptsPropertiesList';
import FilesProperties from '@/src/components/PublicationView/FileProperties/FilesProperties';
import ApplicationProperties from '@/src/components/PublicationView/ApplicationProperties/ApplicationProperties';

interface Props {
  view: ApplicationRoute;
  publication: Publication;
}

const PublicationProperties: FC<Props> = ({ view, publication }) => {
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
      <BasePublicationProperties publication={publication}>
        <ApplicationProperties publication={publication} />
      </BasePublicationProperties>
    );
  }
  return null;
};

export default PublicationProperties;
