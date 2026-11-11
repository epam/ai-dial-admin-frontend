'use client';

import { NoDataContent } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { SESSIONS_ROLE_I18N_KEYS } from '@/src/components/SystemProperties/constants';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionsSourceRoleFailure } from '@/src/models/analytics/sessions-source';

interface Props {
  failure: SessionsSourceRoleFailure | null;
}

const SessionsSourceError: FC<Props> = ({ failure }) => {
  const t = useI18n();

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <NoDataContent
        title={t(SessionsTraceI18nKey.SessionsLoadFailed)}
        description={
          failure
            ? t(SessionsTraceI18nKey.SourceRoleMissing, {
                role: t(SESSIONS_ROLE_I18N_KEYS[failure.role]),
                field: failure.field,
              })
            : undefined
        }
        descriptionClassName="max-w-full break-all px-6 text-center dial-small-text"
      />
    </div>
  );
};

export default SessionsSourceError;
