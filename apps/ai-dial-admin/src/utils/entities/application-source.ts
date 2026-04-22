import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';

export const getSchemaSourceId = (source?: SOURCE_FIELD): string | undefined => {
  return source?.$type === SOURCE_TYPE.SCHEMA ? source.applicationTypeSchemaId : undefined;
};

export const ENDPOINTS_SOURCE: SOURCE_FIELD = {
  $type: SOURCE_TYPE.ENDPOINTS,
};

export const SCHEMA_SOURCE: SOURCE_FIELD = {
  $type: SOURCE_TYPE.SCHEMA,
};

export const createSchemaSource = (applicationTypeSchemaId?: string): SOURCE_FIELD => ({
  $type: SOURCE_TYPE.SCHEMA,
  applicationTypeSchemaId,
});
