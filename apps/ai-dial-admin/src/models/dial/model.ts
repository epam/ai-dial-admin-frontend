import { DialBaseEntity } from './base-entity';

export interface DialModel extends DialBaseEntity {
  type?: DialModelType;
  upstreams?: DialModelEndpoint[];
  tokenizerModel?: string;
  overrideName?: string;
  limits?: DialModelLimit;
  pricing?: DialModelPricing;
  maxRetryAttempts?: number;
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
  endpoint?: string;
  key?: string;
  weight?: number | string;
  tier?: number | string;
  extraData?: DialEndpointExtraData;
}

export enum DialModelType {
  Chat = 'chat',
  Embedding = 'embedding',
}
