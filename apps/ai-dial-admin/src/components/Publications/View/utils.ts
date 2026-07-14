import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { ApplicationPublication, Publication } from '@/src/models/dial/publications';

export const getFormDataForPublication = (file: Publication, files: File[]): FormData => {
  const body = new FormData();

  const fileBlob = new Blob([JSON.stringify(file)], {
    type: APPLICATION_JSON_TYPE,
  });
  body.append('publication', fileBlob);

  if (files.length > 0) {
    files.forEach((f) => {
      body.append('files', f);
    });
  }

  return body;
};

export const getCorrectPublication = (publication: ApplicationPublication): Publication => {
  const defaults = { ...publication?.applicationResources?.[0]?.applicationResource.defaults };
  const applicationProperties = {
    ...publication?.applicationResources?.[0]?.applicationResource.application_properties,
  };

  return {
    ...publication,
    applicationResources: [
      {
        ...publication.applicationResources?.[0],
        applicationResource: {
          ...publication.applicationResources?.[0]?.applicationResource,
          defaults,
          applicationProperties,
        },
      },
    ],
  } as Publication;
};
