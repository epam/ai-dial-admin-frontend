import { ImportStatus } from '@/src/types/import';
import { BaseEntity } from '@/src/models/dial/base-entity';

export interface ImportResult {
  sourcePath: string;
  targetPath: string;
  status: ImportStatus;
}

export type FileConfiguration = Record<string, FileComponentItem[]>;

export interface FileComponentItem {
  importAction: string;
  next: BaseEntity;
  prev?: BaseEntity;
}
