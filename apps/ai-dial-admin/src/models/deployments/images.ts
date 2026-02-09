import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { BaseEntity } from '../dial/base-entity';

export interface Image extends BaseEntity {
  $type: IMAGE_TYPE;
  id: string;
  buildStatus: IMAGE_STATUS;
  version: string;
  topics?: string[];
  source: ImageSource;
  transportType?: IMAGE_TRANSPORT_TYPE;
  author?: string;
  logs?: string[];
  allowedDomains?: string[];
}

export interface ImageGroup {
  name: string;
  selectedId: string;
  availableVersions: ImageVersion[];
}

export interface ImageVersion {
  id: string;
  name: string;
  status: IMAGE_STATUS;
  version: string;
  description?: string;
  topics?: string[];
}

export interface ImageSource {
  $type: IMAGE_SOURCE_TYPE;
  url?: string;
  imageUri?: string;
  branchName?: string;
  sha?: string;
  baseDirectory?: string;
}
