import { SelectOption } from '@epam/ai-dial-ui-kit';

export enum ContentType {
  JSON = 'application/json',
  FormData = 'multipart/form-data',
}

export const contentTypes: SelectOption[] = [
  {
    value: ContentType.JSON,
    label: ContentType.JSON,
  },
  {
    value: ContentType.FormData,
    label: ContentType.FormData,
  },
];
