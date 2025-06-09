import { ErrorType } from '@/src/types/error-type';

export interface FieldError {
  type: ErrorType;
  text: string;
}
