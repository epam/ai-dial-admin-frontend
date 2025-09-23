import { JWT } from 'next-auth/jwt';

import { DialAssetApp } from '@/src/models/dial/asset-app';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { DEFAULT_ETAG, IF_MATCH } from '@/src/constants/api-headers';
import { changePath } from '@/src/utils/files/path';

export const APPS_URL = `${API}/application-resources`;
export const APP_LIST_URL = `${APPS_URL}/list`;
export const APP_DELETE_URL = `${APPS_URL}/delete`;
export const APP_DELETE_BULK_URL = `${APP_DELETE_URL}/bulk`;
export const APP_MOVE_URL = `${APPS_URL}/move`;

export class ApplicationAssetsApi extends BaseApi {
  async getAppsList(token: JWT | null, path: string): Promise<DialAssetApp[] | null | undefined> {
    const allItems: DialAssetApp[] = [];
    let nextToken: string | undefined = undefined;

    while (true) {
      const body: { path: string; nextToken?: string } = { path };
      if (nextToken) {
        body.nextToken = nextToken;
      }

      const response = (await this.post(APP_LIST_URL, body, token)) as
        | { items: DialAssetApp[]; nextToken?: string }
        | undefined;

      if (!response) break;

      if (Array.isArray(response.items) && response.items.length > 0) {
        allItems.push(...response.items);
      }

      if (!response.nextToken) break;

      nextToken = response.nextToken;
    }

    return allItems;
  }

  removeApp(token: JWT | null, path?: string): Promise<ServerActionResponse> {
    return this.postAction(APP_DELETE_URL, { path }, token, { [IF_MATCH]: DEFAULT_ETAG });
  }

  moveApps(token: JWT | null, paths: string[], newPath: string): Promise<ServerActionResponse[]> {
    const requests = paths.map((path) => {
      const body = {
        sourceUrl: path,
        destinationUrl: changePath(path, newPath),
        overwrite: false,
      };
      return this.postAction(APP_MOVE_URL, { ...body }, token);
    });
    return Promise.all(requests);
  }

  bulkDeleteApps(token: JWT | null, paths: { path: string }[]): Promise<ServerActionResponse> {
    return this.postAction(APP_DELETE_BULK_URL, { paths }, token);
  }
}
