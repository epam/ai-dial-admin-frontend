'use client';

import { Spinner } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const SPINNER_SIZE = 40;

interface Props {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/** Fills the editor's box while the bundled Monaco loads, so the layout doesn't shift when it mounts. */
const EditorLoading: FC<Props> = ({ className, width = '100%', height = '100%' }) => {
  const t = useI18n();

  return (
    <div className={className} style={{ width, height }}>
      <Spinner size={SPINNER_SIZE} fullWidth ariaLabel={t(BasicI18nKey.Loading)} />
    </div>
  );
};

export default EditorLoading;
