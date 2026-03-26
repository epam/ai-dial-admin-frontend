'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import {
  DialCheckbox,
  DialGhostButton,
  DialInput,
  DialLabel,
  DialNeutralButton,
  DialRemoveButton,
  DialSelectField,
} from '@epam/ai-dial-ui-kit';

import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  SourceI18nKey,
  ToolsetI18nKey,
} from '@/src/constants/i18n';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { IconExternalLink, IconPlus } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import classNames from 'classnames';
import { ApplicationRoute } from '@/src/types/routes';
import { TRANSPORTS } from './constants';

export enum SourceType {
  ENDPOINT = 'endpoint',
  MCP_CONTEINER = 'mcp',
}

export interface Props {
  entity: DialApplication;
  isEntityImmutable?: boolean;
  isReadOnlyAdmin?: boolean;
  onChangeEntity: (entity: DialApplication) => void;
  isModal?: boolean;
}

const EndpointAndMCPContainer: FC<Props> = ({
  entity,
  onChangeEntity,
  isEntityImmutable,
  isReadOnlyAdmin,
  isModal,
}) => {
  const [checkboxStates, setCheckboxStates] = useState<Record<SourceType, boolean>>({
    [SourceType.ENDPOINT]: !!entity?.endpoint || !entity?.mcp,
    [SourceType.MCP_CONTEINER]: !!entity?.mcp,
  });
  const [mcpEndpoint, setMcpEndpoint] = useState<string | null>(null);
  const t = useI18n();
  const isMobile = useIsMobileScreen();
  const currentLocale = useCurrentLocale();

  useEffect(() => {
    const isEndpointExisting = !!entity?.endpoint;
    const isMCPContainerExisting = !!entity?.mcp;
    setCheckboxStates((prev) => ({
      [SourceType.ENDPOINT]: prev[SourceType.ENDPOINT] || isEndpointExisting,
      [SourceType.MCP_CONTEINER]: prev[SourceType.MCP_CONTEINER] || isMCPContainerExisting,
    }));
  }, [entity]);

  const toggleCheckbox = useCallback(
    (value?: boolean, id?: string) => {
      if (id) {
        const newCheckboxStates = { ...checkboxStates, [id]: !!value };
        setCheckboxStates(newCheckboxStates);
        onChangeEntity({
          ...entity,
          endpoint: newCheckboxStates[SourceType.ENDPOINT] ? entity?.endpoint : undefined,
          mcp: newCheckboxStates[SourceType.MCP_CONTEINER] ? entity?.mcp : undefined,
        });
      }
    },
    [checkboxStates, entity, onChangeEntity],
  );

  const onChangeEndpoint = useCallback(
    (endpoint?: string) => {
      onChangeEntity({ ...entity, endpoint });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPEndpoint = useCallback(
    (newMcpEndpoint?: string) => {
      setMcpEndpoint(newMcpEndpoint || null);
      const updatedMCPContainer = {
        ...(entity.mcp || {}),
        endpoint: newMcpEndpoint || '',
      };
      onChangeEntity({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPTransport = useCallback(
    (transportId: string | string[]) => {
      const selectedTransport = TRANSPORTS.find((source) => source.value === transportId) || TRANSPORTS[0];
      const updatedMCPContainer = {
        ...(entity.mcp || {}),
        endpoint: entity.mcp?.endpoint || '',
        transport: selectedTransport.value,
      };
      onChangeEntity({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onChangeTool = useCallback(
    (index: number, value?: string) => {
      const newMcpTools = [...(entity.mcp?.allowedTools || [])];
      newMcpTools[index] = value || '';

      const updatedMCPContainer = {
        ...(entity.mcp || {}),
        endpoint: entity.mcp?.endpoint || '',
        allowedTools: newMcpTools,
      };
      onChangeEntity({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onAddTool = useCallback(() => {
    const newMcpTools = [...(entity.mcp?.allowedTools || []), ''];
    const updatedMCPContainer = {
      ...(entity.mcp || {}),
      endpoint: entity.mcp?.endpoint || '',
      allowedTools: newMcpTools,
    };
    onChangeEntity({ ...entity, mcp: updatedMCPContainer });
  }, [entity, onChangeEntity]);

  const onRemoveTool = useCallback(
    (index: number) => {
      const newMcpTools = [...(entity.mcp?.allowedTools || [])];
      newMcpTools.splice(index, 1);
      const updatedMCPContainer = {
        ...(entity.mcp || {}),
        endpoint: entity.mcp?.endpoint || '',
        allowedTools: newMcpTools,
      };
      onChangeEntity({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const openInNewTab = useCallback(() => {
    window.open(`/${currentLocale}${ApplicationRoute.McpContainers}/${encodeURIComponent(`${mcpEndpoint}`)}`, '_blank');
  }, [currentLocale, mcpEndpoint]);

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-col w-full gap-4">
        <DialCheckbox
          checked={checkboxStates[SourceType.ENDPOINT]}
          label={t(SourceI18nKey.Endpoint)}
          id={SourceType.ENDPOINT}
          onChange={toggleCheckbox}
          disabled={
            isReadOnlyAdmin || (checkboxStates[SourceType.ENDPOINT] && !checkboxStates[SourceType.MCP_CONTEINER])
          }
        />

        {checkboxStates[SourceType.ENDPOINT] && (
          <div className="w-full pl-6">
            <EndpointControl
              label=""
              id="endpoint"
              placeholder="Enter endpoint"
              required
              disabled={isReadOnlyAdmin}
              endpoint={entity.endpoint}
              onChange={onChangeEndpoint}
              isFullWidth={!isEntityImmutable}
              isModal={isModal}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col w-full gap-4">
        <DialCheckbox
          checked={checkboxStates[SourceType.MCP_CONTEINER]}
          label={t(SourceI18nKey.McpContainer)}
          id={SourceType.MCP_CONTEINER}
          onChange={toggleCheckbox}
          disabled={
            isReadOnlyAdmin || (checkboxStates[SourceType.MCP_CONTEINER] && !checkboxStates[SourceType.ENDPOINT])
          }
        />

        {checkboxStates[SourceType.MCP_CONTEINER] && (
          <div className="h-full flex flex-col gap-y-3 pl-6">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
              <EndpointControl
                label=""
                id="mcp_endpoint"
                placeholder="Enter MCP endpoint"
                required
                disabled={isReadOnlyAdmin}
                endpoint={entity.mcp?.endpoint}
                onChange={onChangeMCPEndpoint}
                isFullWidth={!isEntityImmutable}
                isModal={isModal}
              />
              {mcpEndpoint && (
                <DialNeutralButton
                  label={isMobile ? '' : t(ButtonsI18nKey.Open)}
                  iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                  onClick={openInNewTab}
                />
              )}
            </div>
            <DialSelectField
              id="transport"
              value={entity.mcp?.transport || TRANSPORTS[0].value}
              options={TRANSPORTS}
              containerClassName="max-w-[160px]"
              label={t(EntityFieldsI18nKey.Transport)}
              onChange={onChangeMCPTransport}
              disabled
            />
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH)}>
              <DialLabel label={t(EntityFieldsI18nKey.allowedTools)} />
              {(entity?.mcp?.allowedTools || []).map((item, index) => (
                <div className="flex gap-x-2 items-end">
                  <DialInput
                    id={`mcp-container-tool-${index}`}
                    containerClassName="w-full"
                    value={item}
                    placeholder={t(EntityPlaceholdersI18nKey.ToolName)}
                    onChange={(value) => {
                      onChangeTool(index, value);
                    }}
                  />
                  <div className="w-[40px] shrink-0 mt-[10px]">
                    <DialRemoveButton onClick={() => onRemoveTool(index)} />
                  </div>
                </div>
              ))}
              <DialGhostButton
                label={t(ToolsetI18nKey.AddTools)}
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                className="mt-2 min-h-[34px] h-[34px]"
                onClick={onAddTool}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointAndMCPContainer;
