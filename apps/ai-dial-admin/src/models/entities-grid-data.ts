import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DiffStatus } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';

export interface EntitiesGridData extends DialBaseEntity {
  type?: string;
  route?: string;
  day?: string | null;
  minute?: string | null;
  month?: string | null;
  week?: string | null;
  enabled?: boolean;
  key?: string;
  path?: string;
  $id?: string; // application runner
  dependencies?: EntityType[];
  status?: DiffStatus;
}
