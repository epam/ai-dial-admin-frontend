import { JWT } from 'next-auth/jwt';

import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { DialAdapter } from '@/src/models/dial/adapter';

export const ADAPTERS_URL = `${API}/adapters`;
export const ADAPTER_URL = (id?: string) => `${ADAPTERS_URL}/${id || ''}`;

export class AdaptersApi extends BaseApi {
  getAdaptersList(token: JWT | null): Promise<DialAdapter[] | null> {
    return this.get(ADAPTERS_URL, token);
  }

  getAdaptersListAction(token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(ADAPTERS_URL, token);
  }

  createAdapter(adapter: DialAdapter, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ADAPTERS_URL, adapter, token);
  }

  removeAdapter(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ADAPTER_URL(name), token);
  }

  getAdapter(name: string, token: JWT | null): Promise<DialAdapter | null> {
    return this.get(ADAPTER_URL(name), token);
  }

  updateAdapter(adapter: DialAdapter, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(ADAPTER_URL(adapter.name), adapter, token);
  }
}
