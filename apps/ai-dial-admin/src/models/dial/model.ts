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
  // free. Never default these to '0' — the two mean different invoices. A decision tree carries the
  // same rule per branch: an omitted ifTrue/ifFalse falls back to the prompt rate.
  cacheRead?: PricingRate;
  cacheWrite?: PricingRate;
}

export enum PricingType {
  Token = 'token',
  CharWithoutWhitespace = 'char_without_whitespace',
}

// Comparison operators DIAL Core defines for a pricing decision-tree condition (core's Operator
// enum); the symbol values are what the wire format carries.
export enum PricingOperator {
  EQ = '==',
  NE = '!=',
  GT = '>',
  LT = '<',
  GE = '>=',
  LE = '<=',
}

export interface PricingCondition {
  // A bare standard usage-field name (cachedReadTokens, serviceTier, …) or a '$'-prefixed JSONPath
  // expression evaluated against the call's usage data.
  field: string;
  operator: PricingOperator;
  // Always a string in the UI; Core accepts a string or a number.
  value: string;
}

export interface PricingRateNode {
  test: PricingCondition;
  ifTrue?: PricingRate;
  ifFalse?: PricingRate;
}

// A cache rate on the wire: a flat per-token rate string, or Core's recursive decision tree whose
// branches are themselves the same union. Flat is distinguished by typeof, mirroring Core's
// PricingRate (de)serializers.
export type PricingRate = string | PricingRateNode;

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
  // Independent of `endpoint` (Upstream.baseUrl): the root url an `interfaces` entry with no `endpoint`
  // of its own falls back to. The ingress path plays no part in it, unlike a deployment's own base_url.
  baseUrl?: string;
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
