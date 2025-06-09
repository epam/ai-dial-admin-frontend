import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialKey } from '@/src/models/dial/key';

export const isDialBaseEntity = (entity?: DialBaseEntity | DialKey): entity is DialBaseEntity => {
  return (entity as DialBaseEntity)?.name !== undefined;
};
