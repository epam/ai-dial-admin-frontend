import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialKey } from '@/src/models/dial/key';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const KEYS_URL = `${API}/keys`;
export const KEY_URL = (name?: string) => `${KEYS_URL}/${name || ''}`;
export const CORE_KEY_URL = (name: string) => `${KEYS_URL}/core/${name}`;

export class KeysApi extends BaseApi {
  getKeysList(token: Token): Promise<DialKey[] | null> {
    return this.get(KEYS_URL, token);
  }

  getKey(name: string, token: Token, eTag: string) {
    return this.getActionWithEtag(KEY_URL(name), eTag, token);
  }

  removeKey(token: Token, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(KEY_URL(name), token);
  }

  createKey(key: DialKey, token: Token): Promise<ServerActionResponse> {
    return this.postAction(KEYS_URL, key, token);
  }

  updateKey(key: DialKey, token: Token, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(KEY_URL(encodeURIComponent(key.name || '')), key, token, eTag);
  }

  getCoreKey(name: string, token: Token): Promise<ServerActionResponse<DialKey>> {
    return this.getActionWithEtag(CORE_KEY_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreKey(key: DialKey, name: string, eTag: string, token: Token): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_KEY_URL(encodeURIComponent(name)), key, token, eTag);
  }
}
