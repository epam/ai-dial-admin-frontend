import { JWT } from 'next-auth/jwt';

import { DialAddon } from '@/src/models/dial/addon';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ADDONS_URL = `${API}/addons`;
export const ADDON_URL = (id?: string) => `${ADDONS_URL}/${id || ''}`;

export class AddonsApi extends BaseApi {
  getAddonsList(token: JWT | null): Promise<DialAddon[] | null> {
    return this.get(ADDONS_URL, token);
  }

  createAddon(addon: DialAddon, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ADDONS_URL, addon, token);
  }

  removeAddon(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ADDON_URL(name), token);
  }

  getAddon(name: string, token: JWT | null): Promise<DialAddon | null> {
    return this.get(ADDON_URL(name), token);
  }

  updateAddon(addon: DialAddon, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(ADDON_URL(addon.name), addon, token);
  }
}
