'use client';

import { FC } from 'react';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ResizeHandle: FC = () => {
  const t = useI18n();

  return (
    <div
      className="h-2.5 cursor-ns-resize flex items-center justify-center hover:bg-layer-2 transition-colors"
      role="separator"
      aria-orientation="horizontal"
      aria-label={t(RunsI18nKey.ResizeDrawerLabel)}
    >
      <div className="w-10 h-1 rounded-full bg-tertiary" />
    </div>
  );
};

export default ResizeHandle;
