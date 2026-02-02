'use client';

import { FC, useState } from 'react';

import { DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedApplication?: string;
  onChange: (id: string) => void;
}

const Methods: FC<Props> = ({}) => {
  const t = useI18n();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-row h-full">
      <DialCollapsibleSidebar title={t(MenuI18nKey.Applications)}>AAAA</DialCollapsibleSidebar>

      <div className="flex-1 min-w-0 border border-secondary rounded">{selectedMethod}</div>
    </div>
  );
};

export default Methods;
