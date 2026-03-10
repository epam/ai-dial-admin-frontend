import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { Publication } from '@/src/models/dial/publications';

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
