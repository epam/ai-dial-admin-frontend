import { JWT } from 'next-auth/jwt';

import { DialToolset } from '@/src/models/dial/toolset';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const TOOLSETS_URL = `${API}/toolsets`;
export const TOOLSET_URL = (name?: string) => `${TOOLSETS_URL}/${name}`;

export class ToolsetsApi extends BaseApi {
  getToolsetList(token: JWT | null): Promise<DialToolset[] | null> {
    return this.get(TOOLSETS_URL, token);
  }

  getToolset(name: string, token: JWT | null): Promise<DialToolset | null> {
    return this.get(TOOLSET_URL(name), token);
  }
}
