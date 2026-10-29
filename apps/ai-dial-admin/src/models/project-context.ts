export interface ProjectContextLimits {
  allowedExtensions: string[];
  maxFileBytes: number;
  maxTotalBytes: number;
  maxFiles: number;
}

export enum ContextFileRejectionReason {
  Extension = 'extension',
  FileSize = 'file-size',
  TotalSize = 'total-size',
  FileCount = 'file-count',
  Duplicate = 'duplicate',
}

export interface RejectedContextFile {
  name: string;
  reason: ContextFileRejectionReason;
}

/** A context file already stored in the project, with its size when Core reports one. */
export interface StoredContextFile {
  name: string;
  size?: number;
}
