import { BaseEntity } from '@/src/models/dial/base-entity';
import { DiffStatus } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';
import { ApplicationRoute } from '@/src/types/routes';

export interface EntitiesGridData extends BaseEntity {
  type?: string;
  route?: ApplicationRoute;
  day?: string | null;
  minute?: string | null;
  month?: string | null;
  week?: string | null;
  invitationTtl?: string | null;
  maxAcceptedUsers?: string | null;
  enabled?: boolean;
  key?: string;
  path?: string;
  $id?: string; // application runner
  dependencies?: (EntityType | string)[];
  diffStatus?: DiffStatus;
  topics?: string[];
  descriptionKeywords?: string[];
}
