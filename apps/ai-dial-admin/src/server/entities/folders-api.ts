import { JWT } from 'next-auth/jwt';
import { API } from '../api';
import { BaseApi } from '../base-api';

import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';

export const FOLDERS_URL = `${API}/folders`;
export const RULES_UPDATE_URL = `${FOLDERS_URL}/updateRules`;

export class FoldersApi extends BaseApi {
  getFolders(token: JWT | null, path: string): Promise<DialFolder[] | null> {
    return this.post(FOLDERS_URL, { path }, token).then(
      (response) => (response as { items: DialFolder[] })?.items || [],
    );
  }

  getRules(token: JWT | null, path: string): Promise<Record<string, DialRule[]> | null> {
    return this.get(`${FOLDERS_URL}?path=${path}`, token);
  }

  updateRules(token: JWT | null, targetFolder: string, rules: DialRule[]): Promise<ServerActionResponse> {
    return this.postAction(`${RULES_UPDATE_URL}`, { targetFolder, rules }, token);
  }
}
