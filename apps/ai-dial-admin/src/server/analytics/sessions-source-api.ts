import { Token } from '@/src/models/auth';
import { SessionsSourceSetting, SessionsSourceSettingDto } from '@/src/models/analytics/sessions-source';
import { ServerActionResponse } from '@/src/models/server-action';
import { ANALYTICS_API } from '@/src/server/analytics/audit-api';
import { BaseApi } from '@/src/server/base-api';
import { settingFromDto, settingToDto } from '@/src/utils/analytics/sessions-source';

export const SESSIONS_SOURCE_URL = `${ANALYTICS_API}/settings/sessions-source`;

const NOT_FOUND = 404;

const toSetting = (
  result: ServerActionResponse<SessionsSourceSettingDto>,
): ServerActionResponse<SessionsSourceSetting> =>
  result.success && result.response
    ? { ...result, response: settingFromDto(result.response) }
    : { ...result, response: undefined };

export class SessionsSourceApi extends BaseApi {
  async getSetting(token: Token): Promise<ServerActionResponse<SessionsSourceSetting>> {
    const read: ServerActionResponse<SessionsSourceSettingDto> = await this.getAction(SESSIONS_SOURCE_URL, token);

    return !read.success && read.status === NOT_FOUND ? { success: true } : toSetting(read);
  }

  async putSetting(setting: SessionsSourceSetting, token: Token): Promise<ServerActionResponse<SessionsSourceSetting>> {
    return toSetting(await this.putAction(SESSIONS_SOURCE_URL, settingToDto(setting), token));
  }
}
