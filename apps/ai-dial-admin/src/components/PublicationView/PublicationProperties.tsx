import { FC } from 'react';
import { ApplicationRoute } from '@/src/types/routes';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationProperties from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationProperties';
import PromptsList from '@/src/components/PublicationView/PromptProperties/PromptsList';
import FilesProperties from '@/src/components/PublicationView/FileProperties/FilesProperties';

interface Props {
  view: ApplicationRoute;
  publication: Publication;
}

const PublicationProperties: FC<Props> = ({ view, publication }) => {
  if (view === ApplicationRoute.PromptPublications) {
    return (
      <BasePublicationProperties publication={publication}>
        <PromptsList publication={publication} />
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
  return null;
};

export default PublicationProperties;
