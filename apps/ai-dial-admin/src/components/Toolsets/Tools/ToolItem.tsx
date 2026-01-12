'use client';

import { ButtonAppearance, ButtonVariant, DialButton, DialNeutralButton, DialSwitch } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { FC, useCallback, MouseEvent } from 'react';

import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useAppContext } from '@/src/context/AppContext';
import TryOut from '../../Common/Sidebar/TryOut';

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
  const { showSidebar } = useAppContext().sidebar;

  const openTryOutSidebar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      showSidebar(
        <TryOut>
          <p>TODO...</p>
        </TryOut>,
      );
    },
    [showSidebar],
  );

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
          <DialButton
            appearance={ButtonAppearance.Outlined}
            variant={ButtonVariant.Neutral}
            className="flex items-center justify-center mr-2.5"
            iconBefore={<IconPlayerPlay size={20} />}
            onClick={openTryOutSidebar}
            label={t(ToolsetI18nKey.TryOut)}
          />
          {!readonly && <DialSwitch switchId={tool} isOn={isEnabled} onChange={(value) => onChangeIsEnabled(value)} />}
        </div>
      </div>
    </div>
  );
};

export default ToolItem;
