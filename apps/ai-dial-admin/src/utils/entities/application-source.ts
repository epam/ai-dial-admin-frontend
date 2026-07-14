import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';

export const getSchemaSourceId = (source?: SOURCE_FIELD): string | undefined => {
  return source?.$type === SOURCE_TYPE.SCHEMA ? source.applicationTypeSchemaId : undefined;
};

/**
 * Virtual source-type value used only in the UI (source selector / labels) to represent a Code App.
 * It is never written to `source.$type`, which always stays {@link SOURCE_TYPE.ENDPOINTS} for a Code App.
 */
export const CODE_APP_SOURCE_TYPE = 'code-app';

interface CodeAppCandidate {
  source?: SOURCE_FIELD;
  endpoint?: string | null;
  editor_url?: string;
}

/**
 * A Code App is an endpoints-type application whose `endpoint` and `editor_url` both equal the
 * configured `CODE_APP_EDITOR_URL`.
 */
export const isCodeAppSource = (entity?: CodeAppCandidate, codeAppEditorUrl?: string): boolean =>
  !!codeAppEditorUrl &&
  entity?.source?.$type === SOURCE_TYPE.ENDPOINTS &&
  entity?.endpoint === codeAppEditorUrl &&
  entity?.editor_url === codeAppEditorUrl;

/**
 * Fields applied to an application when the Code App source type is selected.
 */
export const createCodeAppFields = (codeAppEditorUrl?: string) => ({
  source: { $type: SOURCE_TYPE.ENDPOINTS },
  endpoint: codeAppEditorUrl,
  editor_url: codeAppEditorUrl,
});

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
