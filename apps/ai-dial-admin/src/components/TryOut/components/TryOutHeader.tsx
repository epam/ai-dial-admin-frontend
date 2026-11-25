'use client';

import { FC, ReactNode } from 'react';

import { CloseButton } from '@epam/ai-dial-ui-kit';

import { useCloseTryOutSidebar } from '@/src/components/TryOut/hooks/use-try-out-sidebar';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** Shown beside the title. */
  leadingActions?: ReactNode;
  /** Shown before the close button. */
  trailingActions?: ReactNode;
}

const TryOutHeader: FC<Props> = ({ leadingActions, trailingActions }) => {
  const t = useI18n();
  const onClose = useCloseTryOutSidebar();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-row items-center gap-3 min-w-0">
        <h1 className="truncate">{t(ButtonsI18nKey.TryOut)}</h1>
        {leadingActions}
      </div>
      <div className="flex flex-row items-center gap-x-4">
        {trailingActions}
        <CloseButton onClose={onClose} />
      </div>
    </div>
  );
};

export default TryOutHeader;
