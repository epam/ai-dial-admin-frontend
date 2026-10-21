import {
  MAX_FILE_SIZE_MB,
  MAX_FILES_ROUTE_FILE_SIZE_MB,
  MAX_FILES_ROUTE_MULTI_FILES_SIZE_MB,
  MAX_MULTI_FILES_SIZE_MB,
} from '@/src/constants/file';
import { ImportSizeLimits } from '@/src/models/import-size-limits';
import { ApplicationRoute } from '@/src/types/routes';

export const getImportSizeLimits = (route?: ApplicationRoute): ImportSizeLimits =>
  route === ApplicationRoute.Files
    ? { maxFileSizeMb: MAX_FILES_ROUTE_FILE_SIZE_MB, maxMultiFilesSizeMb: MAX_FILES_ROUTE_MULTI_FILES_SIZE_MB }
    : { maxFileSizeMb: MAX_FILE_SIZE_MB, maxMultiFilesSizeMb: MAX_MULTI_FILES_SIZE_MB };
