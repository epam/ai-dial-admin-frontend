'use client';

import { FC, useState } from 'react';

import { DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  methods: string[];
}

const Methods: FC<Props> = ({ methods }) => {
  const t = useI18n();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-row h-full">
      <DialCollapsibleSidebar title={t(MenuI18nKey.Applications)}>
        <div className="flex flex-col gap-y-3">
          {methods.map((method) => (
            <div key={method}>{method}</div>
          ))}
        </div>
      </DialCollapsibleSidebar>

      <div className="flex-1 min-w-0 border border-primary rounded">{selectedMethod}</div>
    </div>
  );
};

export default Methods;
