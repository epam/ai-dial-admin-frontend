import { ChatEntity } from './base-entity';
import { DialDeploymentInterface } from './interfaces';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';

export interface DialModel extends ChatEntity {
  type?: DialModelType;
  tokenizerModel?: string;
  overrideName?: string;
  limits?: DialModelLimit;
  pricing?: DialModelPricing;
  displayVersion?: string;
  upstreams?: DialModelEndpoint[];
  source?: SOURCE_FIELD;
  responsesEndpoint?: string;
  embeddingDimensions?: number;
  interfaces?: Record<string, DialDeploymentInterface>;
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
  // An absent cache rate tells DIAL Core to bill cached tokens at the prompt rate; '0' bills them as
  // free. Never default these to '0' — the two mean different invoices.
  cacheRead?: string;
  cacheWrite?: string;
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

// Per-interface override for a DialModelEndpoint, peer of DialDeploymentInterface/DialResourceInterface
// but carrying the upstream's own fields (a complete endpoint, not a base url) rather than one base_url.
// Every field left unset here falls back to the DialModelEndpoint's own namesake for that interface.
export interface DialUpstreamInterface {
  endpoint?: string;
  key?: string;
  extraData?: DialEndpointExtraData | null;
  secretExtraData?: DialEndpointExtraData | null;
}

export interface DialModelEndpoint {
  id?: string;
  endpoint?: string;
  key?: string;
  weight?: number | string;
  tier?: number | string;
  extraData?: DialEndpointExtraData | null;
  secretExtraData?: DialEndpointExtraData | null;
  responsesEndpoint?: string;
  interfaces?: Record<string, DialUpstreamInterface>;
}

export enum DialModelType {
  Chat = 'chat',
  Embedding = 'embedding',
}
