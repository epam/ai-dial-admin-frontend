import {
  ContextFileRejectionReason,
  ProjectContextLimits,
  RejectedContextFile,
  StoredContextFile,
} from '@/src/models/project-context';

export interface ContextFilesCheck {
  accepted: File[];
  rejected: RejectedContextFile[];
}

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

export const getFileExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex > 0 ? fileName.slice(dotIndex + 1).toLowerCase() : '';
};

/** Total size of the context files that count toward the capacity; a stored file with no reported size counts as 0. */
export const getContextFilesSize = (files: { size?: number }[]): number =>
  files.reduce((total, file) => total + (file.size ?? 0), 0);

export const formatContextSize = (bytes: number): string => {
  if (bytes >= BYTES_PER_MB) {
    return `${Number((bytes / BYTES_PER_MB).toFixed(1))} MB`;
  }
  if (bytes >= BYTES_PER_KB) {
    return `${Number((bytes / BYTES_PER_KB).toFixed(1))} KB`;
  }
  return `${bytes} B`;
};

/**
 * Splits the incoming files into those that may be staged and those that may not, in the order given: each
 * accepted file counts toward the duplicate, count and capacity checks of the files after it. `existing` is every
 * file that will remain in the project (stored files not staged for removal, plus files already staged to add).
 */
export const checkContextFiles = (
  incoming: File[],
  existing: StoredContextFile[],
  limits: ProjectContextLimits,
): ContextFilesCheck => {
  const names = new Set(existing.map((file) => file.name));
  let count = existing.length;
  let totalBytes = getContextFilesSize(existing);
  const accepted: File[] = [];
  const rejected: RejectedContextFile[] = [];

  for (const file of incoming) {
    const reason = getRejectionReason(file, names, count, totalBytes, limits);
    if (reason) {
      rejected.push({ name: file.name, reason });
      continue;
    }
    accepted.push(file);
    names.add(file.name);
    count += 1;
    totalBytes += file.size;
  }

  return { accepted, rejected };
};

const getRejectionReason = (
  file: File,
  names: Set<string>,
  count: number,
  totalBytes: number,
  limits: ProjectContextLimits,
): ContextFileRejectionReason | undefined => {
  if (!limits.allowedExtensions.includes(getFileExtension(file.name))) {
    return ContextFileRejectionReason.Extension;
  }
  if (file.size > limits.maxFileBytes) {
    return ContextFileRejectionReason.FileSize;
  }
  if (names.has(file.name)) {
    return ContextFileRejectionReason.Duplicate;
  }
  if (count >= limits.maxFiles) {
    return ContextFileRejectionReason.FileCount;
  }
  if (totalBytes + file.size > limits.maxTotalBytes) {
    return ContextFileRejectionReason.TotalSize;
  }
  return undefined;
};
