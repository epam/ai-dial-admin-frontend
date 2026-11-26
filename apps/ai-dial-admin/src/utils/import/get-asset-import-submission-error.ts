import { MAX_ASSET_IMPORT_CONFIG_SIZE_MB, MAX_ASSET_IMPORT_FILE_SIZE_MB } from '@/src/constants/file';
import { ImportI18nKey } from '@/src/constants/i18n';
import { ImportFileType } from '@/src/types/import';

const BYTES_PER_MIB = 1024 * 1024;

export const getAssetImportSubmissionError = (body: FormData, fileType: ImportFileType): ImportI18nKey | undefined => {
  const config = body.get('config');
  if (config instanceof Blob && config.size > MAX_ASSET_IMPORT_CONFIG_SIZE_MB * BYTES_PER_MIB) {
    return ImportI18nKey.ImportConfigSizeError;
  }

  const file = body.get('file');
  if (
    fileType === ImportFileType.JSON &&
    file instanceof Blob &&
    file.size > MAX_ASSET_IMPORT_FILE_SIZE_MB * BYTES_PER_MIB
  ) {
    return ImportI18nKey.PreparedJsonSizeError;
  }

  return undefined;
};
