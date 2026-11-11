import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import SessionsSourceError from '@/src/components/Analytics/SessionsTrace/SessionsSourceError';
import { SESSIONS_ROLE_I18N_KEYS } from '@/src/components/SystemProperties/constants';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import * as client from '@/src/locales/client';
import { SessionsRole } from '@/src/models/analytics/sessions-source';

const interpolating = ((key: string, params?: Record<string, string>) =>
  params ? `${key} ${Object.values(params).join(' ')}` : key) as unknown as ReturnType<typeof client.useI18n>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionsSourceError', () => {
  test('states that the sessions could not be loaded', () => {
    render(<SessionsSourceError failure={null} />);

    expect(screen.getByText(SessionsTraceI18nKey.SessionsLoadFailed)).toBeTruthy();
    expect(screen.queryByText(SessionsTraceI18nKey.SourceRoleMissing)).toBeNull();
  });

  test('names the role that did not resolve and the field it is bound to', () => {
    vi.spyOn(client, 'useI18n').mockReturnValue(interpolating);

    render(<SessionsSourceError failure={{ role: SessionsRole.Time, field: 'ended_at' }} />);

    expect(
      screen.getByText(
        `${SessionsTraceI18nKey.SourceRoleMissing} ${SESSIONS_ROLE_I18N_KEYS[SessionsRole.Time]} ended_at`,
      ),
    ).toBeTruthy();
  });

  test('describes the failure with the role-missing message', () => {
    render(<SessionsSourceError failure={{ role: SessionsRole.SessionId, field: 'run_key' }} />);

    expect(screen.getByText(SessionsTraceI18nKey.SourceRoleMissing)).toBeTruthy();
  });
});
