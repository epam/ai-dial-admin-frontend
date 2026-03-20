import { DialUploadFileItem } from '@epam/ai-dial-ui-kit';

import { FileManagerI18nKey } from '@/src/constants/i18n';
import { CREATE_FOLDER_FORBIDDEN_CHARS, FILE_NAME_MAX_LENGTH } from './constants';

export const getValidationMessages = (t: (key: string) => string) => {
  return { emptyName: t(FileManagerI18nKey.EnterFolderName), duplicateName: t(FileManagerI18nKey.NameExists) };
};

export const getDestinationFolderPopupOptions = (
  t: (key: string, options?: Record<string, string | number> | undefined) => string,
) => ({
  getMoveHeader: (itemsCount: number, itemName?: string) =>
    itemsCount === 1 && itemName
      ? t(FileManagerI18nKey.MoveItem, { item: itemName })
      : t(FileManagerI18nKey.MoveItems, { count: itemsCount }),
});

export const createEmptyFile = () => {
  const fileName = '.dial_folder';
  const fileType = 'text/plain';

  const emptyFile = new File(['1'], fileName, {
    type: fileType,
  });
  return { emptyFile, fileName, fileType };
};

export const getEmptyFile = () => {
  const { emptyFile, fileName } = createEmptyFile();

  const uploadFileItem: DialUploadFileItem = {
    fileContent: emptyFile,
    name: fileName,
  };

  return uploadFileItem;
};

export const validateCreateFolder = (
  name: string,
  t: (key: string, options?: Record<string, string | number>) => string,
): string | null => {
  if (CREATE_FOLDER_FORBIDDEN_CHARS.test(name)) {
    return t(FileManagerI18nKey.CreateFolderValidate);
  } else if (name.startsWith('.')) {
    return t(FileManagerI18nKey.CreateFolderValidateFirstSymbol);
  } else if (name.length > FILE_NAME_MAX_LENGTH) {
    return t(FileManagerI18nKey.CreateFolderValidateNameLength, { length: FILE_NAME_MAX_LENGTH });
  }

  return null;
};
