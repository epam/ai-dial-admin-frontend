import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { TestSuiteRequestTemplateBody } from '@/src/models/evaluation/test-suite';
import { FormDataPart } from '@/src/models/form-data';

export type BodyContent = Record<string, unknown> | FormDataPart[];

const JSON_CONTENT_INDENT = 4;

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

export const getBodyText = (body?: TestSuiteRequestTemplateBody): string => {
  if (body?.jsonataContent != null) {
    return body.jsonataContent;
  }

  const content = body?.content;

  return Array.isArray(content) ? '' : JSON.stringify(content ?? {}, null, JSON_CONTENT_INDENT);
};

export const getContentForJsonataExpression = (jsonataContent?: string, contentType?: string): BodyContent => {
  const parsed = parseJsonObject(jsonataContent);

  return parsed && contentType !== ContentType.FormData ? parsed : getDefaultContentForType(contentType);
};
