import { ImportStatus } from '@/src/types/import';

export interface ImportResult {
  sourcePath: string;
  targetPath: string;
  status: ImportStatus;
}
