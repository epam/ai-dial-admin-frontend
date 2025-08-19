import { IconEyeOff } from '@tabler/icons-react';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { ExportI18nKey } from '@/src/constants/i18n';

const NoPreview: FC = () => {
  const t = useI18n();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-secondary bg-layer-3">
      <IconEyeOff width={50} height={50} />
      <span className="small mt-1 text-primary">{t(ExportI18nKey.NoPreview)}</span>
    </div>
  );
};

export default NoPreview;
