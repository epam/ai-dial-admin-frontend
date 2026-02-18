import { Token } from '@/src/models/auth';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ADAPTERS_URL = `${API}/adapters`;
export const ADAPTER_URL = (id?: string) => `${ADAPTERS_URL}/${id || ''}`;

export class AdaptersApi extends BaseApi {
  getAdaptersList(token: Token | undefined): Promise<DialAdapter[] | null> {
    return this.get(ADAPTERS_URL, token);
  }

  getAdaptersListAction(token: Token | undefined): Promise<ServerActionResponse<DialAdapter[]>> {
    return this.getAction(ADAPTERS_URL, token);
  }

  createAdapter(adapter: DialAdapter, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(ADAPTERS_URL, adapter, token);
  }

  removeAdapter(token: Token | undefined, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ADAPTER_URL(name), token);
  }

  getAdapter(name: string, token: Token | undefined, eTag: string) {
    return this.getActionWithEtag(ADAPTER_URL(name), eTag, token);
  }

  updateAdapter(adapter: DialAdapter, token: Token | undefined, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(ADAPTER_URL(encodeURIComponent(adapter.name || '')), adapter, token, eTag);
  }
}
