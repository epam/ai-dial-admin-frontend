import { ImportStatus } from '@/src/types/import';
import { DialBaseEntity } from '@/src/models/dial/base-entity';

export interface ImportResult {
  sourcePath: string;
  targetPath: string;
  status: ImportStatus;
}

export type FileConfiguration = Record<string, FileComponentItem[]>;

export interface FileComponentItem {
  importAction: string;
  value: DialBaseEntity;
}
