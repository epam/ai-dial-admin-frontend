import { DialFile } from './dial/file';

export interface FileImportMap {
  files: DialFile[];
  isInvalid: boolean;
}

export interface FileImportGridData {
  name: string;
  fileName: string;
  extension: string;
  existingNames?: string[];
  index: number;
  invalid?: boolean;
}
