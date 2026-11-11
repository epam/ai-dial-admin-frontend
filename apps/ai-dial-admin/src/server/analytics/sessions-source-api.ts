import { SessionsSourceSetting, SessionsSourceSettingDto } from '@/src/models/analytics/sessions-source';
import { ServerActionResponse } from '@/src/models/server-action';
import { settingFromDto, settingToDto } from '@/src/utils/analytics/sessions-source';

interface SessionsSourceStore {
  stored: SessionsSourceSettingDto | null;
}

const STORE_KEY = Symbol.for('dial-admin.sessions-source-store');

const processStore = (): SessionsSourceStore => {
  const holder = globalThis as unknown as Record<symbol, SessionsSourceStore | undefined>;
  holder[STORE_KEY] ??= { stored: null };

  return holder[STORE_KEY];
};

export class SessionsSourceApi {
  constructor(private readonly store: SessionsSourceStore = processStore()) {}

  async getSetting(): Promise<ServerActionResponse<SessionsSourceSetting>> {
    const { stored } = this.store;

    return stored ? { success: true, response: settingFromDto(stored) } : { success: true };
  }

  async putSetting(setting: SessionsSourceSetting): Promise<ServerActionResponse<SessionsSourceSetting>> {
    this.store.stored = { ...settingToDto(setting), updated_at: new Date().toISOString() };

    return { success: true, response: settingFromDto(this.store.stored) };
  }
}
