import { FC, MouseEvent, ReactNode, useCallback } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';
import classNames from 'classnames';

import TryOut from '@/src/components/Tools/Tool/TryOut';
import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Tool as ToolType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  tool: ToolType;
  toolSetName: string;
  disabled?: boolean;
  isCollapsed?: boolean;
  isAddedManual?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  containerId?: string;
  viewSelector?: ReactNode;
  view?: ApplicationRoute;
}

const ToolHeader: FC<Props> = ({
  tool,
  toolSetName,
  disabled,
  isCollapsed,
  isAddedManual,
  isMcpToolset,
  isAssetToolset,
  containerId,
  viewSelector,
  view,
}) => {
  const t = useI18n();
  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  const openTryOutSidebar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      sidebar.showSidebar(
        <SaveValidationContextProvider>
          <TryOut
            tool={tool}
            toolSetName={toolSetName}
            isAssetToolset={isAssetToolset}
            isMcpToolset={isMcpToolset}
            containerId={containerId}
            view={view}
          />
        </SaveValidationContextProvider>,
        'w-1/2 max-w-[800px]',
      );
      if (sidebarOpen) {
        sidebar.toggleIsMenuClosed?.();
        toggleSidebar(e);
      }
    },
    [containerId, isAssetToolset, isMcpToolset, sidebar, sidebarOpen, toggleSidebar, tool, toolSetName, view],
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
      {!isAddedManual && (
        <div className="flex flex-row items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {!isCollapsed && viewSelector}
          {!isCollapsed && !!viewSelector && !disabled && <div className="w-px h-6 bg-layer-4"></div>}

          {!disabled && (
            <DialNeutralButton
              className={classNames(isCollapsed && 'invisible group-hover/accordion:visible')}
              iconBefore={<IconPlayerPlay size={20} />}
              onClick={openTryOutSidebar}
              label={t(ButtonsI18nKey.TryOut)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ToolHeader;
