import { JWT } from 'next-auth/jwt';

import { DialKey } from '@/src/models/dial/key';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const KEYS_URL = `${API}/keys`;
export const KEY_URL = (name?: string) => `${KEYS_URL}/${name}`;

export class KeysApi extends BaseApi {
  getKeysList(token: JWT | null): Promise<DialKey[] | null> {
    return this.get(KEYS_URL, token);
  }

  getKey(name: string, token: JWT | null): Promise<DialKey | null> {
    return this.get(KEY_URL(name), token);
  }

  removeKey(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(KEY_URL(name), token);
  }

  createKey(key: DialKey, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(KEYS_URL, key, token);
  }

  updateKey(key: DialKey, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(KEY_URL(key.name), key, token);
  }
}
