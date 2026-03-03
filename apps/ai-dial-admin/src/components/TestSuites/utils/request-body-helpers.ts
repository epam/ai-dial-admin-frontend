import type { DialScheme } from '@/src/models/dial/scheme';
import type { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import {
  REQUEST_BODY_CONTENT_TYPE,
  type JsonRequestBodyDto,
  type JsonRequestBodySchemaDto,
  type PolymorphicRequestBodySchemaDto,
  type RequestTemplateBody,
} from '@/src/types/evaluation';

function isJsonBodyDto(
  body: RequestTemplateBody | undefined,
): body is JsonRequestBodyDto {
  return (
    body != null &&
    typeof body === 'object' &&
    'contentType' in body &&
    (body as JsonRequestBodyDto).contentType === REQUEST_BODY_CONTENT_TYPE.JSON
  );
}

/**
 * Returns the JSON content for the request template body for editing.
 * Handles polymorphic ({ contentType, content }) and legacy plain object.
 */
export function getRequestTemplateJsonBody(
  template: TestSuiteRequestTemplate | undefined,
): Record<string, unknown> {
  const body = template?.body;
  if (!body || typeof body !== 'object') return {};
  if (isJsonBodyDto(body)) return (body.content as Record<string, unknown>) || {};
  return body as Record<string, unknown>;
}

/**
 * Updates the request template with JSON body (wraps in polymorphic format).
 */
export function setRequestTemplateJsonBody(
  template: TestSuiteRequestTemplate,
  content: Record<string, unknown>,
): TestSuiteRequestTemplate {
  const body: JsonRequestBodyDto = {
    contentType: REQUEST_BODY_CONTENT_TYPE.JSON,
    content,
  };
  return { ...template, body };
}

function isJsonSchemaDto(
  schema: PolymorphicRequestBodySchemaDto | DialScheme | undefined,
): schema is JsonRequestBodySchemaDto {
  return (
    schema != null &&
    typeof schema === 'object' &&
    'contentType' in schema &&
    (schema as JsonRequestBodySchemaDto).contentType === REQUEST_BODY_CONTENT_TYPE.JSON
  );
}

/**
 * Returns the JSON schema object for request body schema for editing.
 * Handles polymorphic ({ contentType, schema }) and legacy DialScheme.
 */
export function getRequestBodySchemaJson(
  schema: PolymorphicRequestBodySchemaDto | DialScheme | undefined,
): Record<string, unknown> | undefined {
  if (!schema || typeof schema !== 'object') return undefined;
  if (isJsonSchemaDto(schema)) return (schema.schema as Record<string, unknown>) ?? undefined;
  return schema as Record<string, unknown>;
}

/**
 * Wraps a JSON schema in polymorphic request body schema format.
 */
export function wrapRequestBodySchemaJson(
  schema: Record<string, unknown>,
): JsonRequestBodySchemaDto {
  return {
    contentType: REQUEST_BODY_CONTENT_TYPE.JSON,
    schema,
  };
}
