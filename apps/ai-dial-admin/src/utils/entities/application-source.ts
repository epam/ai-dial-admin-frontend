import { ApplicationSource, ApplicationSourceType } from '@/src/models/dial/application';

export const getSchemaSourceId = (source?: ApplicationSource): string | undefined => {
  return source?.$type === ApplicationSourceType.SCHEMA ? source.applicationTypeSchemaId : undefined;
};

export const ENDPOINTS_SOURCE: ApplicationSource = {
  $type: ApplicationSourceType.ENDPOINTS,
};

export const SCHEMA_SOURCE: ApplicationSource = {
  $type: ApplicationSourceType.SCHEMA,
};

export const createSchemaSource = (applicationTypeSchemaId?: string): ApplicationSource => ({
  $type: ApplicationSourceType.SCHEMA,
  applicationTypeSchemaId,
});
