'use client';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  chatId: string;
}

const SessionDetailError: FC<Props> = ({ chatId }) => {
  const t = useI18n();

  return (
    <div className="flex size-full flex-col items-center justify-center rounded bg-layer-2">
      <DialNoDataContent
        title={t(SessionsTraceI18nKey.DetailLoadFailed)}
        description={chatId}
        descriptionClassName="max-w-full break-all px-6 text-center font-mono dial-tiny-text"
      />
    </div>
  );
};

export default SessionDetailError;
