import { InterfaceMode, TranslatorReference } from '@/src/models/dial/interfaces';

// Shape InterfaceRow reads/writes as one object — a superset of DialResourceInterface (snake_case
// `base_url`/`default_headers`) and DialDeploymentInterface (camelCase `baseUrl`/`defaultHeaders`), so
// one component works for both casings via the `baseUrlKey`/`defaultHeadersKey` InterfacesField passes.
export interface BaseUrlInterfaceValue {
  baseUrl?: string;
  base_url?: string;
  mode?: InterfaceMode;
  translator?: TranslatorReference;
  default_headers?: Record<string, string>;
  defaultHeaders?: Record<string, string>;
  defaults?: Record<string, unknown>;
  features?: Record<string, unknown>;
}

export type BaseUrlKey = 'baseUrl' | 'base_url';
export type DefaultHeadersKey = 'defaultHeaders' | 'default_headers';
