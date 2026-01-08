import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { BaseEntity } from './dial/base-entity';

export interface CoreSyncStatus {
  currentState?: BaseEntity;
  configState?: BaseEntity;
  status?: EntitySyncStatus;
}
