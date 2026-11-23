'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import { FC } from 'react';

import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ICON_SIZE = 14;

interface Props {
  id: string;
}

const HopPartialNote: FC<Props> = ({ id }) => {
  const t = useI18n();

  return (
    <p id={id} className="flex items-center gap-1.5 text-warning dial-caption-text">
      <IconAlertTriangle size={ICON_SIZE} className="shrink-0" aria-hidden />
      <span>{t(SessionsTraceI18nKey.InspectorRequestPartial)}</span>
    </p>
  );
};

export default HopPartialNote;
