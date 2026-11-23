'use client';

import { NoDataContent } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { SESSIONS_ROLE_I18N_KEYS } from '@/src/components/SystemProperties/constants';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionsSourceProblem, SessionsSourceRoleFailure } from '@/src/models/analytics/sessions-source';

interface Props {
  failure: SessionsSourceRoleFailure | null;
  problem?: SessionsSourceProblem;
}

const PROBLEM_DESCRIPTIONS: Record<SessionsSourceProblem, SessionsTraceI18nKey> = {
  [SessionsSourceProblem.SettingUnreadable]: SessionsTraceI18nKey.SourceSettingReadFailed,
  [SessionsSourceProblem.DefaultTableMissing]: SessionsTraceI18nKey.SourceNotConfigured,
};

const SessionsSourceError: FC<Props> = ({ failure, problem }) => {
  const t = useI18n();

  const describe = () => {
    if (failure) {
      return t(SessionsTraceI18nKey.SourceRoleMissing, {
        role: t(SESSIONS_ROLE_I18N_KEYS[failure.role]),
        field: failure.field,
      });
    }

    return problem ? t(PROBLEM_DESCRIPTIONS[problem]) : undefined;
  };

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <NoDataContent
        title={t(
          problem === SessionsSourceProblem.DefaultTableMissing
            ? SessionsTraceI18nKey.SourceNotConfiguredTitle
            : SessionsTraceI18nKey.SessionsLoadFailed,
        )}
        description={describe()}
        descriptionClassName="max-w-full break-all px-6 text-center dial-small-text"
      />
    </div>
  );
};

export default SessionsSourceError;
