import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { FormDataPart } from '@/src/models/form-data';

export type BodyContent = Record<string, unknown> | FormDataPart[];

export const getDefaultContentForType = (contentType?: string): BodyContent =>
  contentType === ContentType.FormData ? [] : {};
