import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { FormDataPart } from '@/src/models/form-data';

export type BodyContent = Record<string, unknown> | FormDataPart[];

const JSON_CONTENT_INDENT = 4;
const EMPTY_JSONATA_EXPRESSION = '{}';

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJsonObject = (text?: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(text ?? '');
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const getDefaultContentForType = (contentType?: string): BodyContent =>
  contentType === ContentType.FormData ? [] : {};

// A JSON object literal is itself a valid JSONata object constructor, so authored JSON content carries over
// verbatim; the indent matches EntityJsonEditor's `JSON.stringify(entity, null, 4)` so the user lands on the
// text they were already looking at. Form-data parts are an array, not an expression, and are not carried.
export const getJsonataExpressionForContent = (content?: BodyContent): string =>
  isJsonObject(content) ? JSON.stringify(content, null, JSON_CONTENT_INDENT) : EMPTY_JSONATA_EXPRESSION;

export const getContentForJsonataExpression = (jsonataContent?: string, contentType?: string): BodyContent => {
  const parsed = parseJsonObject(jsonataContent);

  // A form-data body must stay an array — `FormDataGrid` is typed `FormDataPart[]` (design D1b) — so a
  // parseable object is only carried back under a JSON or absent content type.
  return parsed && contentType !== ContentType.FormData ? parsed : getDefaultContentForType(contentType);
};
