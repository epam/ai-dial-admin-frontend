import { DialBaseNamedEntity } from './base-entity';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';

export interface DialInterceptor extends DialBaseNamedEntity {
  endpoint?: string;
  configurationEndpoint?: string;
  forwardAuthToken?: boolean;
  entities?: string[];
  author?: string;
  createdAt?: number;
  updatedAt?: number;
  source?: SOURCE_FIELD;
}
