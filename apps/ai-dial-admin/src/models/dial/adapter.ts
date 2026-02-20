import { BaseEntity } from '@/src/models/dial/base-entity';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';

export interface DialAdapter extends BaseEntity {
  models?: string[];
  baseEndpoint?: string;
  source?: SOURCE_FIELD;
}
