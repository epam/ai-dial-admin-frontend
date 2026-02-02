import { FC, MouseEvent, ReactNode, useCallback } from 'react';

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
  viewSelector?: ReactNode;
}

const ToolHeader: FC<Props> = ({
  tool,
  toolSetName,
  isCollapsed,
  isAddedManual,
  isMcpToolset,
  isAssetToolset,
  viewSelector,
}) => {
  const t = useI18n();
  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  const openTryOutSidebar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      sidebar.showSidebar(
        <SaveValidationContextProvider>
          <TryOut tool={tool} toolSetName={toolSetName} isAssetToolset={isAssetToolset} />
        </SaveValidationContextProvider>,
      );
      if (sidebarOpen) {
        sidebar.toggleIsMenuClosed?.();
        toggleSidebar(e);
      }
    },
    [isAssetToolset, sidebar, sidebarOpen, toggleSidebar, tool, toolSetName],
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
        <div className="flex flex-row items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {!isCollapsed && viewSelector}
          {!isCollapsed && !!viewSelector && <div className="w-[1px] h-6 bg-layer-4"></div>}
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
        </div>
      )}
    </div>
  );
};

export default ToolHeader;
