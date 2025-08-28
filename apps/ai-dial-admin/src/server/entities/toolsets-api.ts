import { JWT } from 'next-auth/jwt';

import { DialToolset } from '@/src/models/dial/toolset';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const TOOLSETS_URL = `${API}/toolSets`;
export const TOOLSET_URL = (name?: string) => `${TOOLSETS_URL}/${name}`;

export class ToolsetsApi extends BaseApi {
  getToolsetList(token: JWT | null): Promise<DialToolset[] | null> {
    return this.get(TOOLSETS_URL, token);
  }

  getToolset(name: string, token: JWT | null): Promise<DialToolset | null> {
    return this.get(TOOLSET_URL(name), token);
  }

  removeToolset(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(TOOLSET_URL(name), token);
  }

  createToolset(toolset: DialToolset, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(TOOLSETS_URL, toolset, token);
  }

  updateToolset(toolset: DialToolset, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(TOOLSET_URL(toolset.name), toolset, token);
  }
}
