import { FC } from 'react';
import { ApplicationRoute } from '@/src/types/routes';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationProperties from '@/src/components/Publications/Properties/Properties';
import PromptsPropertiesList from '@/src/components/Publications/Assets/Prompt/PromptsPropertiesList';
import FilesProperties from '@/src/components/Publications/Assets/Files/FilesProperties';
import ApplicationProperties from '@/src/components/Publications/Assets/Application/ApplicationProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import ToolsetProperties from '@/src/components/Publications/Assets/Toolset/ToolsetProperties';

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

  if (view === ApplicationRoute.ToolsetPublications) {
    return (
      <BasePublicationProperties publication={publication} applicationSchemes={applicationSchemes || []}>
        <ToolsetProperties publication={publication} />
      </BasePublicationProperties>
    );
  }
  return null;
};

export default PublicationProperties;
