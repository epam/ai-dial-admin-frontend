import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DiffStatus } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';
import { ApplicationRoute } from '@/src/types/routes';

export interface EntitiesGridData extends DialBaseEntity {
  type?: string;
  route?: ApplicationRoute;
  day?: string | null;
  minute?: string | null;
  month?: string | null;
  week?: string | null;
  invitationTtl?: number | null;
  maxAcceptedUsers?: number | null;
  enabled?: boolean;
  key?: string;
  path?: string;
  $id?: string; // application runner
  dependencies?: (EntityType | string)[];
  status?: DiffStatus;
}
