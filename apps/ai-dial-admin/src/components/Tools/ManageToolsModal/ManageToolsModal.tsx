'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import {
  ButtonAppearance,
  DialCollapsibleSidebar,
  DialNeutralButton,
  DialNoDataContent,
  DialPopup,
  DialPrimaryButton,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import Search from '@/src/components/Common/Search/Search';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import ToolContent from '@/src/components/Tools/Tool/ToolContent';
import { ButtonsI18nKey, EntitiesI18nKey, ErrorI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Tool, Toolset } from '@/src/models/dial/toolset';
import { ErrorType } from '@/src/types/error-type';
import { ParamsView } from '@/src/types/parameters';

import AddNewTool from './AddNewTool';
import { defaultToolName } from './constants';
import ToolSwitcher from './ToolSwitcher';
import { CustomToolConfig, ToolConfig } from './types';
import { generateUniqueName, getCustomToolErrorType, getToggledToolsConfig } from './utils';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  isModalOpen: boolean;
  tools: Tool[];
  originalEntity: Toolset;
  onClose: () => void;
  onConfirm?: (newValue: Toolset) => void;
}

const ManageToolsModal: FC<Props> = ({ isModalOpen, tools, originalEntity, onClose, onConfirm }) => {
  const t = useI18n();
  const [view, setView] = useState(ParamsView.TABLE);

  const [toolsConfig, setToolsConfig] = useState<ToolConfig[]>(() => {
    return tools.map((tool) => ({
      ...tool,
      isAllowed: (originalEntity.allowedTools || []).includes(tool.name),
      id: uuidv4(),
    }));
  });
  const [customToolsConfig, setCustomToolsConfig] = useState<CustomToolConfig[]>(() => {
    return (originalEntity.allowedTools || []).reduce((acc, curr) => {
      if (!tools.some((tool) => tool.name === curr) && curr !== '') {
        acc.push({
          id: uuidv4(),
          name: curr,
          isAllowed: true,
          error: null,
        });
      }
      return acc;
    }, [] as CustomToolConfig[]);
  });
  const [pattern, setPattern] = useState<string>('');
  const [activeTool, setActiveTool] = useState<ToolConfig | null>(null);
  const [activeCustomTool, setActiveCustomTool] = useState<CustomToolConfig | null>(null);
  const [isValid, setIsValid] = useState(true);

  const filteredTools = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    return toolsConfig.filter((tool) => tool.name.toLowerCase().includes(patternLower));
  }, [toolsConfig, pattern]);

  const filteredCustomTools = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    return customToolsConfig.filter((tool) => tool.name.toLowerCase().includes(patternLower));
  }, [customToolsConfig, pattern]);

  const toolNames = useMemo(() => {
    return toolsConfig.map((tool) => tool.name);
  }, [toolsConfig]);

  const validateCustomToolNames = useCallback(
    (newCustomToolsConfig: CustomToolConfig[]) => {
      const customToolNames = newCustomToolsConfig.map((tool) => tool.name);
      let isCustomToolsValid = true;

      newCustomToolsConfig.forEach((customTool) => {
        const errorType = getCustomToolErrorType(customTool.name, [...toolNames, ...customToolNames]);
        if (errorType) {
          isCustomToolsValid = false;
          customTool.error = {
            type: errorType,
            text: errorType === ErrorType.EMPTY ? t(ErrorI18nKey.EmptyField) : t(ErrorI18nKey.Unique),
          };
        } else {
          customTool.error = null;
        }
      });

      setIsValid(isCustomToolsValid);
      setCustomToolsConfig(newCustomToolsConfig);
    },
    [t, toolNames],
  );

  const toggleTool = useCallback(
    (index: number, isCustom: boolean) => {
      if (isCustom) {
        const newToolsConfig = getToggledToolsConfig(customToolsConfig, filteredCustomTools, index);
        setCustomToolsConfig(newToolsConfig as CustomToolConfig[]);
      } else {
        const newToolsConfig = getToggledToolsConfig(toolsConfig, filteredTools, index);
        setToolsConfig(newToolsConfig as ToolConfig[]);
      }
    },
    [toolsConfig, customToolsConfig, filteredCustomTools, filteredTools],
  );

  const addNewCustomTool = useCallback(() => {
    const customToolName = generateUniqueName(
      customToolsConfig.map((tool) => tool.name),
      defaultToolName,
    );
    const newCustomTool = { name: customToolName, isAllowed: true, error: null, id: uuidv4() };
    setCustomToolsConfig([...customToolsConfig, newCustomTool]);
    setActiveCustomTool(newCustomTool);
    setActiveTool(null);
  }, [customToolsConfig]);

  const onCustomToolDelete = useCallback(() => {
    if (activeCustomTool === null) {
      return;
    }

    const newCustomToolsConfig = customToolsConfig.filter((tool) => tool.id !== activeCustomTool.id);
    validateCustomToolNames(newCustomToolsConfig);
    setActiveCustomTool(null);
  }, [activeCustomTool, customToolsConfig, validateCustomToolNames]);

  const onCustomToolNameChange = useCallback(
    (value: string) => {
      if (activeCustomTool === null) {
        return;
      }

      const newCustomToolsConfig = structuredClone(customToolsConfig);
      const targetTool = newCustomToolsConfig.find((tool) => tool.id === activeCustomTool.id);
      if (targetTool) {
        targetTool.name = value;
        setActiveCustomTool(targetTool);
      }
      validateCustomToolNames(newCustomToolsConfig);
    },
    [activeCustomTool, customToolsConfig, validateCustomToolNames],
  );

  const onToolClick = useCallback(
    (index: number, isCustomTool: boolean) => {
      if (isCustomTool) {
        setActiveTool(null);
        setActiveCustomTool(filteredCustomTools[index]);
      } else {
        setActiveTool(filteredTools[index]);
        setActiveCustomTool(null);
      }
    },
    [filteredCustomTools, filteredTools],
  );

  const onConfirmChanges = useCallback(() => {
    const allowedTools = toolsConfig.filter((tool) => tool.isAllowed).map((tool) => tool.name);
    const allowedCustomTools = customToolsConfig.filter((tool) => tool.isAllowed).map((tool) => tool.name);

    const uniqueAllowedTools = [...new Set([...allowedTools, ...allowedCustomTools])];
    onConfirm?.({
      ...originalEntity,
      allowedTools: uniqueAllowedTools?.length ? uniqueAllowedTools : [''],
    });
    onClose();
  }, [originalEntity, onConfirm, onClose, toolsConfig, customToolsConfig]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(ToolsetI18nKey.ManageTools)}
      portalId="ManageToolsModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[800px]"
      dividers
      footer={
        <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialPrimaryButton label={t(ButtonsI18nKey.Confirm)} onClick={onConfirmChanges} disabled={!isValid} />
        </div>
      }
    >
      <div className="h-full px-6 py-4 flex flex-1 min-h-0">
        <DialCollapsibleSidebar
          width={280}
          title={t(ToolsetI18nKey.Tools)}
          containerClassName="bg-layer-3 mr-2 h-full border border-primary"
        >
          <Search onChange={(search) => setPattern(search)} />
          <div className="border-b border-primary pb-1">
            <span className="dial-tiny text-secondary mt-4 block">{t(ToolsetI18nKey.AvailableForYou)}</span>
            {filteredTools.length ? (
              <>
                {filteredTools.map((tool, index) => (
                  <ToolSwitcher
                    key={index}
                    index={index}
                    isCustomTool={false}
                    toolName={tool.name}
                    isOn={tool.isAllowed}
                    isActive={tool.id === activeTool?.id}
                    onClick={onToolClick}
                    onSwitch={toggleTool}
                  />
                ))}
              </>
            ) : (
              <div className="py-3">
                <DialNoDataContent title={t(EntitiesI18nKey.NoTools)} />
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-row justify-between items-center mt-2 pr-[4px]">
              <span className="dial-tiny text-secondary">{t(ToolsetI18nKey.OtherInAToolset)}</span>
              <DialPrimaryButton
                appearance={ButtonAppearance.Link}
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                label={t(ButtonsI18nKey.Add)}
                onClick={addNewCustomTool}
              />
            </div>
            {filteredCustomTools.length ? (
              <>
                {filteredCustomTools.map((tool, index) => (
                  <ToolSwitcher
                    key={index}
                    index={index}
                    isCustomTool
                    toolName={tool.name}
                    isOn={tool.isAllowed}
                    isActive={tool.id === activeCustomTool?.id}
                    onClick={onToolClick}
                    onSwitch={toggleTool}
                  />
                ))}
              </>
            ) : (
              <div className="py-2">
                <DialNoDataContent title={t(EntitiesI18nKey.NoTools)} />
              </div>
            )}
          </div>
        </DialCollapsibleSidebar>
        <div className="border border-primary p-4 w-full overflow-auto">
          {activeCustomTool && (
            <AddNewTool
              toolName={activeCustomTool.name}
              onDelete={onCustomToolDelete}
              onChange={onCustomToolNameChange}
              error={activeCustomTool.error}
            />
          )}
          {activeTool && (
            <>
              <div className="flex flex-row justify-between">
                <h2 className="mt-2">{activeTool.name}</h2>
                <ViewSelector view={view} changeView={setView} />
              </div>
              <ToolContent tool={activeTool} view={view} />
            </>
          )}
        </div>
      </div>
    </DialPopup>
  );
};

export default ManageToolsModal;
