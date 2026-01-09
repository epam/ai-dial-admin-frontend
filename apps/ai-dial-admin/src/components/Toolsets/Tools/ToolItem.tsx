'use client';

import { DialNeutralButton, DialSwitch } from '@epam/ai-dial-ui-kit';
import { IconTrash } from '@tabler/icons-react';
import { FC } from 'react';

import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

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
    <div className="w-full h-[56px]">
      <div className="p-3 h-full group mb-2 border border-primary rounded flex flex-row items-center justify-between hover:border-hover cursor-pointer">
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
              <DialNeutralButton
                label={t(ButtonsI18nKey.Delete)}
                iconBefore={<IconTrash {...BASE_BUTTON_ICON_PROPS} />}
                onClick={() => onRemoveTool?.(tool)}
              />
            </div>
          )}

          {!readonly && <DialSwitch switchId={tool} isOn={isEnabled} onChange={(value) => onChangeIsEnabled(value)} />}
        </div>
      </div>
    </div>
  );
};

export default ToolItem;
