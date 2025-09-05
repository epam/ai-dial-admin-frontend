'use client';

import { FC } from 'react';
import { useI18n } from '@/src/locales/client';
import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import Switch from '@/src/components/Common/Switch/Switch';
import Button from '../../Common/Button/Button';
import { IconTrash } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '../../../constants/main-layout';

interface Props {
  tool: string;
  readonly: boolean;
  isAddedManual?: boolean;
  isEnabled?: boolean;
  onRemoveTool?: (tool: string) => void;
  onChangeIsEnabled: (isEnabled: boolean) => void;
}

const ToolItem: FC<Props> = ({ tool, isAddedManual, onRemoveTool, isEnabled, readonly, onChangeIsEnabled }) => {
  const t = useI18n();

  return (
    <div className="p-3 group h-[56px] mb-2 gro border border-primary rounded flex flex-row items-center justify-between hover:border-hover cursor-pointer">
      <div className="flex flex-row items-center">
        <h3>{tool}</h3>
        {isAddedManual && (
          <span className="ml-4 tiny h-[22px] block px-2 py-1 border border-accent-primary bg-accent-primary-alpha rounded">
            {t(ToolsetI18nKey.AddedManually)}
          </span>
        )}
      </div>
      <div className="flex flex-row items-center">
        {isAddedManual && (
          <div className="invisible group-hover:visible">
            <Button
              cssClass="secondary"
              title={t(ButtonsI18nKey.Delete)}
              iconBefore={<IconTrash {...BASE_ICON_PROPS} />}
              onClick={() => onRemoveTool?.(tool)}
            />
          </div>
        )}

        {!readonly && <Switch switchId={tool} isOn={isEnabled} onChange={(value) => onChangeIsEnabled(value)} />}
      </div>
    </div>
  );
};

export default ToolItem;
