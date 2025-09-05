'use client';

import { FC } from 'react';
import { useI18n } from '@/src/locales/client';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import Switch from '@/src/components/Common/Switch/Switch';

interface Props {
  tool: string;
  readonly: boolean;
  isAddedManual?: boolean;
  isEnabled?: boolean;
  onChangeIsEnabled: (isEnabled: boolean) => void;
}

const ToolItem: FC<Props> = ({ tool, isAddedManual, isEnabled, readonly, onChangeIsEnabled }) => {
  const t = useI18n();

  return (
    <div className="p-3 mb-2 border border-primary rounded flex flex-row items-center justify-between">
      <div className="flex flex-row items-center">
        <h3>{tool}</h3>
        {isAddedManual && (
          <span className="ml-4 tiny h-[22px] block px-2 py-1 border border-accent-primary bg-accent-primary-alpha rounded">
            {t(ToolsetI18nKey.AddedManually)}
          </span>
        )}
      </div>

      {!readonly && <Switch switchId={tool} isOn={isEnabled} onChange={(value) => onChangeIsEnabled(value)} />}
    </div>
  );
};

export default ToolItem;
