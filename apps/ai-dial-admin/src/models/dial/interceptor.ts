import { DialBaseNamedEntity } from './base-entity';

export interface DialInterceptor extends DialBaseNamedEntity {
  endpoint?: string;
  forwardAuthToken?: boolean;
  entities?: string[];
}
