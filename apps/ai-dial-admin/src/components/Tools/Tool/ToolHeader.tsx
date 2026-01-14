import { FC, MouseEvent, useCallback } from 'react';

import { ButtonAppearance, ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';
import classNames from 'classnames';

import TryOut from '@/src/components/Tools/Tool/TryOut';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Tool as ToolType } from '@/src/models/dial/toolset';

interface Props {
  tool: ToolType;
  toolSetName: string;
  isCollapsed?: boolean;
  isAddedManual?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
}

const ToolHeader: FC<Props> = ({ tool, toolSetName, isCollapsed, isAddedManual, isMcpToolset, isAssetToolset }) => {
  const t = useI18n();
  const { showSidebar } = useAppContext().sidebar;

  const openTryOutSidebar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      showSidebar(
        <SaveValidationContextProvider>
          <TryOut tool={tool} toolSetName={toolSetName} isAssetToolset={isAssetToolset} />
        </SaveValidationContextProvider>,
      );
    },
    [isAssetToolset, showSidebar, tool, toolSetName],
  );

  return (
    <div className="w-full flex flex-row items-center justify-between">
      <div className="flex flex-row items-center">
        <h3 className="mx-2">{tool.name}</h3>
        {isAddedManual && (
          <span className="ml-4 tiny h-[22px] block px-2 py-1 border border-accent-primary bg-accent-primary-alpha rounded">
            {t(ToolsetI18nKey.AddedManually)}
          </span>
        )}
      </div>
      {!isAddedManual && !isMcpToolset && (
        <DialButton
          appearance={ButtonAppearance.Outlined}
          variant={ButtonVariant.Neutral}
          className={classNames(
            'flex items-center justify-center',
            isCollapsed && 'invisible group-hover/accordion:visible',
          )}
          iconBefore={<IconPlayerPlay size={20} />}
          onClick={openTryOutSidebar}
          label={t(ToolsetI18nKey.TryOut)}
        />
      )}
    </div>
  );
};

export default ToolHeader;
