import { ReactNode } from 'react';

export enum FileUploadError {
  Format = 'format',
  Size = 'size',
  Count = 'count',
}

export interface FileUploadFieldProps {
  fieldTitle: string;
  elementId: string;
  files?: File[];
  acceptTypes: string;
  emptyTextFirstLine?: string;
  emptyTextSecondLine?: string;
  emptyButtonLabel?: string;
  maxFilesCount?: number;
  maxFileSize?: number;
  maxMultiFilesSize?: number;
  multiple?: boolean;
  fileFormatError?: string;
  fileCountError?: string;
  fileSizeError?: string;
  multiFilesSizeError?: string;
  onChange: (files: File[]) => void;
  iconBeforeInput?: ReactNode;
  dynamicIcon?: (name: string) => ReactNode;
  isInvalid?: (file: File) => boolean;
  errorText?: string;
  deleteAllButtonLabel?: string;
  addButtonLabel?: string;
  additionalActionButtons?: ReactNode;
}

export interface FileValidationParams {
  incoming: File[];
  existingCount: number;
  acceptTypes: string;
  maxFilesCount?: number;
  maxFileSize?: number;
}
