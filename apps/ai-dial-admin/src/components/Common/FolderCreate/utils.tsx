import { IconExternalLink } from '@tabler/icons-react';

import AddChildIcon from '@/public/images/icons/add-child.svg';
import AddSiblingIcon from '@/public/images/icons/add-sibling.svg';
import { isInvalidJson, isLargeFile } from '@/src/components/EntityListView/Import/import';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ParsedPrompts, PromptImportGridData } from '@/src/models/prompts';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { FolderOperationDeclaration, ZipFilePreview } from './models';
import { FolderOperation } from './types';
import { DialFile } from '@/src/models/dial/file';

export const getAddSiblingOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <AddSiblingIcon {...BASE_ICON_PROPS} />,
    id: FolderOperation.Add_sibling,
    onClick,
  };
};

export const getAddChildOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <AddChildIcon {...BASE_ICON_PROPS} />,
    id: FolderOperation.Add_child,
    onClick,
  };
};

export const getManageFolderOperation = (onClick: () => void): FolderOperationDeclaration => {
  return {
    icon: <IconExternalLink {...BASE_ICON_PROPS} />,
    id: FolderOperation.Manage_folder,
    onClick,
  };
};

export const isErrorPromptReview = (data: PromptImportGridData): boolean => {
  return !data.version || !data.promptName || !!data.invalid;
};

export const isErrorFileReview = (data: FileImportGridData): boolean => {
  return !data.name || !!data.invalid;
};

export const readJsonFiles = async (files: File[]): Promise<Map<string, FileImportMap>> => {
  const results = new Map<string, FileImportMap>();

  const readFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsedData: ParsedPrompts = JSON.parse(reader.result as string);
          const isInvalid = isInvalidJson(parsedData);
          results.set(file.name, { files: parsedData?.prompts, isInvalid });
        } catch (error) {
          console.error('Error parsing JSON:', error);
          results.set(file.name, { files: [], isInvalid: true });
        }
        resolve();
      };

      reader.onerror = () => {
        console.error('Error reading file:', file.name);
        results.set(file.name, { files: [], isInvalid: true });
        resolve();
      };

      reader.readAsText(file);
    });
  };
  await Promise.all(files.map(readFile));
  return results;
};

export const readAllFiles = (files: File[]): Map<string, FileImportMap> => {
  const results = new Map<string, FileImportMap>();
  files.map((file) => {
    const isInvalid = isLargeFile(file);
    results.set(file.name, { files: [file] as unknown as DialFile[], isInvalid });
  });
  return results;
};

export const generatePreviewData = (preview: ZipFilePreview[]): Map<string, FileImportMap> => {
  const resultMap = new Map();

  preview.forEach(({ fileName, name, version }) => {
    const file = getFolderNameAndPath(fileName).name;
    const id = `${name}__${version}`;

    if (!resultMap.has(file)) {
      resultMap.set(file, { files: [{ id }], isInvalid: false });
    } else {
      resultMap.get(file).files.push({ id });
    }
  });

  return resultMap;
};
