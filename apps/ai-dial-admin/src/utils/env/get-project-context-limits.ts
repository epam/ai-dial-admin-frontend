import {
  DEFAULT_PROJECT_CONTEXT_ALLOWED_EXTENSIONS,
  DEFAULT_PROJECT_CONTEXT_FILE_MAX_BYTES,
  DEFAULT_PROJECT_CONTEXT_TOTAL_MAX_BYTES,
  PROJECT_CONTEXT_MAX_FILES,
} from '@/src/constants/project';
import { ProjectContextLimits } from '@/src/models/project-context';

const readPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Parses `PROJECT_CONTEXT_ALLOWED_EXTENSIONS`: a comma-separated list, trimmed, lower-cased, with a leading `.`
 * stripped and empty entries dropped. An unset or empty value yields the defaults.
 */
export const parseProjectContextExtensions = (value: string | undefined): string[] => {
  const parsed = (value ?? '')
    .split(',')
    .map((part) => part.trim().toLowerCase().replace(/^\./, ''))
    .filter((part) => part.length > 0);

  return parsed.length > 0 ? parsed : [...DEFAULT_PROJECT_CONTEXT_ALLOWED_EXTENSIONS];
};

/**
 * Limits for a project's context files, overridable per deployment with the same variables and defaults as the
 * chat application. Read on every call so a value is picked up from the running process's environment rather
 * than frozen at import time.
 */
export const getProjectContextLimits = (): ProjectContextLimits => ({
  allowedExtensions: parseProjectContextExtensions(process.env.PROJECT_CONTEXT_ALLOWED_EXTENSIONS),
  maxFileBytes: readPositiveInt(process.env.PROJECT_CONTEXT_FILE_MAX_BYTES, DEFAULT_PROJECT_CONTEXT_FILE_MAX_BYTES),
  maxTotalBytes: readPositiveInt(process.env.PROJECT_CONTEXT_TOTAL_MAX_BYTES, DEFAULT_PROJECT_CONTEXT_TOTAL_MAX_BYTES),
  maxFiles: PROJECT_CONTEXT_MAX_FILES,
});
