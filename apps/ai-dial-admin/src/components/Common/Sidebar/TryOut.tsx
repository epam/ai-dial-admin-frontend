'use client';

import { FC, ReactNode } from 'react';
import { DialCloseButton } from '@epam/ai-dial-ui-kit';
import { useI18n } from '@/src/locales/client';

import { useAppContext } from '@/src/context/AppContext';
import { ToolsetI18nKey } from '@/src/constants/i18n';

interface Props {
  children?: ReactNode;
}

const TryOut: FC<Props> = ({ children }) => {
  const t = useI18n();
  const { closeSidebar } = useAppContext().sidebar;

  return (
    <div className="flex flex-col gap-y-8 w-[500px]">
      <div className="flex items-center justify-between">
        <h3 className="text-primary overflow-ellipsis">{t(ToolsetI18nKey.TryOut)}</h3>
        <DialCloseButton onClose={closeSidebar} />
      </div>
      <div className="overflow-y-scroll">{children}</div>
    </div>
  );
};

export default TryOut;
