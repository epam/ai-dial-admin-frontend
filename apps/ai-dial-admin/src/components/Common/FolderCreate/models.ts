import { ReactNode } from 'react';

import { FolderOperation } from './types';

export interface FolderOperationDeclaration {
  icon: ReactNode;
  id: FolderOperation;
  onClick: () => void;
}
export interface ZipFilePreview {
  fileName: string;
  name?: string;
  version?: string;
}
