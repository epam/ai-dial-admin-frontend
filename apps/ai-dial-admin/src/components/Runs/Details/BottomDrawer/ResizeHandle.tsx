'use client';

import { FC } from 'react';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ResizeHandle: FC = () => {
  const t = useI18n();

  return (
    <div
      className="h-1.5 cursor-ns-resize flex items-center justify-center hover:bg-layer-3"
      role="separator"
      aria-orientation="horizontal"
      aria-label={t(RunsI18nKey.ResizeDrawerLabel)}
    >
      <div className="w-8 flex flex-col gap-px items-center">
        <div className="w-full h-px bg-secondary" />
        <div className="w-full h-px bg-secondary" />
        <div className="w-full h-px bg-secondary" />
      </div>
    </div>
  );
};

export default ResizeHandle;
