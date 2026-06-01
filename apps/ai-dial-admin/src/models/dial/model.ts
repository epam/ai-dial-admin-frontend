import { ChatEntity } from './base-entity';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';

export interface DialModel extends ChatEntity {
  type?: DialModelType;
  tokenizerModel?: string;
  overrideName?: string;
  limits?: DialModelLimit;
  pricing?: DialModelPricing;
  fieldsHashingOrder?: string[];
  displayVersion?: string;
  upstreams?: DialModelEndpoint[];
  source?: SOURCE_FIELD;
  responsesEndpoint?: string;
}

export interface DialTokenizer {
  name?: string;
  id?: string;
  description?: string;
}

export interface DialModelPricing {
  unit?: PricingType;
  prompt?: string;
  completion?: string;
}

export enum PricingType {
  Token = 'token',
  CharWithoutWhitespace = 'char_without_whitespace',
}

export interface DialModelLimit {
  maxCompletionTokens?: number | string;
  maxPromptTokens?: number | string;
  maxTotalTokens?: number | string;
}

export type DialEndpointExtraData = string | object;

export interface DialModelEndpoint {
  id?: string;
  endpoint?: string;
  key?: string;
  weight?: number | string;
  tier?: number | string;
  extraData?: DialEndpointExtraData;
  responsesEndpoint?: string;
}

export enum DialModelType {
  Chat = 'chat',
  Embedding = 'embedding',
}
