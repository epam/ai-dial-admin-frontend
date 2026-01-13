import { FC, MouseEvent, useCallback, useState } from 'react';

import { ButtonAppearance, ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight, IconPlayerPlay } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import classNames from 'classnames';

import TryOut from '@/src/components/Common/Sidebar/TryOut';
import JsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import Grid from '@/src/components/Grid/Grid';
import { ContainersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Tool as ToolType } from '@/src/models/dial/toolset';

interface Props {
  tool: ToolType;
  isAddedManual?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  toolSetName: string;
}

const TOOL_ANNOTATION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Annotation', floatingFilter: false, filter: false, sortable: false },
  { field: 'value', headerName: 'Value', floatingFilter: false, filter: false, sortable: false },
];

const Tool: FC<Props> = ({ tool, isAddedManual, isMcpToolset, isAssetToolset, toolSetName }) => {
  const t = useI18n();
  const { showSidebar } = useAppContext().sidebar;

  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

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
    <div className="flex flex-col border-primary border px-4 py-2">
      <div className="flex items-center justify-between cursor-pointer group" onClick={toggleCollapse}>
        <div className="flex items-center">
          <i className="text-icon-secondary">
            {isCollapsed ? (
              <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
            ) : (
              <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
            )}
          </i>
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
            className={classNames('flex items-center justify-center', isCollapsed && 'invisible group-hover:visible')}
            iconBefore={<IconPlayerPlay size={20} />}
            onClick={openTryOutSidebar}
            label={t(ToolsetI18nKey.TryOut)}
          />
        )}
      </div>
      {!isCollapsed && (
        <div className="flex flex-col mt-4 gap-4">
          {tool.description && <p className="body">{tool.description}</p>}
          {tool.inputSchema && (
            <div className="flex flex-col">
              <div className="flex flex-row justify-between  mb-2">
                <p className="small text-secondary">{t(ContainersI18nKey.InputSchema)}</p>
              </div>
              <div className="flex h-[400px]">
                <JsonEditor entity={tool.inputSchema.properties} readonly={true} />
              </div>
            </div>
          )}
          {tool.annotations && (
            <div className="flex flex-col">
              <div className="flex flex-row justify-between mb-2">
                <p className="small text-secondary">{t(ContainersI18nKey.Annotations)}</p>
              </div>
              <Grid
                columnDefs={TOOL_ANNOTATION_COLUMNS}
                rowData={Object.entries(tool.annotations).map(([name, value]) => ({
                  name,
                  value: String(value),
                }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tool;
