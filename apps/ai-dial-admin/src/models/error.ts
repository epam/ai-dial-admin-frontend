import { ErrorType } from '@/src/types/error-type';

export interface FieldError {
  type: ErrorType;
  text: string;
}

export type Translate = (key: string, options?: Record<string, string | number>) => string;

export type GetItemError = (value: string | undefined, t: Translate) => FieldError | null;
