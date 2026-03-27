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
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
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
  MCP_CONTAINER = 'mcp',
}

export interface Props {
  entity: DialApplication | DialApplicationScheme;
  view?: ApplicationRoute;
  isEntityImmutable?: boolean;
  isReadOnlyAdmin?: boolean;
  onChangeEntity: (entity: DialApplication | DialApplicationScheme) => void;
  isModal?: boolean;
}

const EndpointAndMCPContainer: FC<Props> = ({
  entity,
  onChangeEntity,
  isEntityImmutable,
  isReadOnlyAdmin,
  view,
  isModal,
}) => {
  const [checkboxStates, setCheckboxStates] = useState<Record<SourceType, boolean>>(() => {
    if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
      return {
        [SourceType.ENDPOINT]: !!(entity as DialApplication)?.endpoint || !(entity as DialApplication)?.mcp,
        [SourceType.MCP_CONTAINER]: !!(entity as DialApplication)?.mcp,
      };
    } else {
      return {
        [SourceType.ENDPOINT]:
          !!(entity as DialApplicationScheme)?.['dial:applicationTypeCompletionEndpoint'] ||
          !(entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`],
        [SourceType.MCP_CONTAINER]: !!(entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`],
      };
    }
  });

  const [mcpEndpoint, setMcpEndpoint] = useState<string | null>(null);
  const t = useI18n();
  const isMobile = useIsMobileScreen();
  const currentLocale = useCurrentLocale();

  useEffect(() => {
    const isEndpointExisting =
      view === ApplicationRoute.ApplicationRunners
        ? !!(entity as DialApplicationScheme)?.['dial:applicationTypeCompletionEndpoint']
        : !!(entity as DialApplication)?.endpoint;
    const isMCPContainerExisting =
      view === ApplicationRoute.ApplicationRunners
        ? !!(entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`]
        : !!(entity as DialApplication)?.mcp;
    setCheckboxStates((prev) => ({
      [SourceType.ENDPOINT]: prev[SourceType.ENDPOINT] || isEndpointExisting,
      [SourceType.MCP_CONTAINER]: prev[SourceType.MCP_CONTAINER] || isMCPContainerExisting,
    }));
    const newMcpEndpoint =
      (entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`]?.['dial:endpoint'] ||
      (entity as DialApplication)?.mcp?.endpoint;
    setMcpEndpoint(newMcpEndpoint || null);
  }, [entity, view]);

  const toggleCheckbox = useCallback(
    (value?: boolean, id?: string) => {
      if (id) {
        const newCheckboxStates = { ...checkboxStates, [id]: !!value };
        setCheckboxStates(newCheckboxStates);

        if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
          onChangeEntity({
            ...entity,
            endpoint: newCheckboxStates[SourceType.ENDPOINT] ? (entity as DialApplication)?.endpoint : undefined,
            mcp: newCheckboxStates[SourceType.MCP_CONTAINER] ? (entity as DialApplication)?.mcp : undefined,
          });
        } else if (view === ApplicationRoute.ApplicationRunners) {
          onChangeEntity({
            ...entity,
            ['dial:applicationTypeCompletionEndpoint']: newCheckboxStates[SourceType.ENDPOINT]
              ? (entity as DialApplicationScheme)?.['dial:applicationTypeCompletionEndpoint']
              : undefined,
            [`dial:applicationTypeMcp`]: newCheckboxStates[SourceType.MCP_CONTAINER]
              ? (entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`]
              : undefined,
          });
        }
      }
    },
    [checkboxStates, entity, onChangeEntity, view],
  );

  const onChangeEndpoint = useCallback(
    (endpoint?: string) => {
      if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
        onChangeEntity({ ...entity, endpoint });
      } else if (view === ApplicationRoute.ApplicationRunners) {
        onChangeEntity({ ...entity, 'dial:applicationTypeCompletionEndpoint': endpoint });
      }
    },
    [entity, onChangeEntity, view],
  );

  const onChangeMCPEndpoint = useCallback(
    (newMcpEndpoint?: string) => {
      if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
        setMcpEndpoint(newMcpEndpoint || null);
        const updatedMCPContainer = {
          ...((entity as DialApplication)?.mcp || {}),
          endpoint: newMcpEndpoint || '',
        };
        onChangeEntity({ ...entity, mcp: updatedMCPContainer });
      } else if (view === ApplicationRoute.ApplicationRunners) {
        setMcpEndpoint(newMcpEndpoint || null);
        const updatedMCPContainer = {
          ...((entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`] || {}),
          ['dial:endpoint']: newMcpEndpoint || '',
        };
        onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
      }
    },
    [entity, onChangeEntity, view],
  );

  const onChangeMCPTransport = useCallback(
    (transportId: string | string[]) => {
      if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
        const selectedTransport = TRANSPORTS.find((source) => source.value === transportId) || TRANSPORTS[0];
        const updatedMCPContainer = {
          ...((entity as DialApplication).mcp || {}),
          endpoint: (entity as DialApplication).mcp?.endpoint || '',
          transport: selectedTransport.value,
        };
        onChangeEntity({ ...entity, mcp: updatedMCPContainer });
      } else if (view === ApplicationRoute.ApplicationRunners) {
        const selectedTransport = TRANSPORTS.find((source) => source.value === transportId) || TRANSPORTS[0];
        const updatedMCPContainer = {
          ...((entity as DialApplicationScheme)?.['dial:applicationTypeMcp'] || {}),
          ['dial:endpoint']: (entity as DialApplicationScheme)?.['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
          ['dial:transport']: selectedTransport.value,
        };
        onChangeEntity({ ...entity, ['dial:applicationTypeMcp']: updatedMCPContainer });
      }
    },
    [entity, onChangeEntity, view],
  );

  const onChangeTool = useCallback(
    (index: number, value?: string) => {
      const currentEntity = entity as DialApplication;
      const newMcpTools = [...(currentEntity.mcp?.allowedTools || [])];
      newMcpTools[index] = value || '';

      const updatedMCPContainer = {
        ...(currentEntity.mcp || {}),
        endpoint: currentEntity.mcp?.endpoint || '',
        allowedTools: newMcpTools,
      };
      onChangeEntity({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onAddTool = useCallback(() => {
    const currentEntity = entity as DialApplication;
    const newMcpTools = [...(currentEntity.mcp?.allowedTools || []), ''];
    const updatedMCPContainer = {
      ...(currentEntity.mcp || {}),
      endpoint: currentEntity.mcp?.endpoint || '',
      allowedTools: newMcpTools,
    };
    onChangeEntity({ ...entity, mcp: updatedMCPContainer });
  }, [entity, onChangeEntity]);

  const onRemoveTool = useCallback(
    (index: number) => {
      const currentEntity = entity as DialApplication;
      const newMcpTools = [...(currentEntity.mcp?.allowedTools || [])];
      newMcpTools.splice(index, 1);
      const updatedMCPContainer = {
        ...(currentEntity.mcp || {}),
        endpoint: currentEntity.mcp?.endpoint || '',
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
    <div className="flex flex-col w-full gap-8 border border-primary rounded p-4">
      <div className="flex flex-col w-full gap-4">
        <DialCheckbox
          checked={checkboxStates[SourceType.ENDPOINT]}
          label={t(SourceI18nKey.Endpoint)}
          id={SourceType.ENDPOINT}
          onChange={toggleCheckbox}
          disabled={
            isReadOnlyAdmin || (checkboxStates[SourceType.ENDPOINT] && !checkboxStates[SourceType.MCP_CONTAINER])
          }
        />

        {checkboxStates[SourceType.ENDPOINT] && (
          <div className="w-full pl-6">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
              <EndpointControl
                label=""
                id="endpoint"
                placeholder="Enter endpoint"
                required
                disabled={isReadOnlyAdmin}
                endpoint={
                  view === ApplicationRoute.ApplicationRunners
                    ? (entity as DialApplicationScheme)?.['dial:applicationTypeCompletionEndpoint']
                    : (entity as DialApplication)?.endpoint
                }
                onChange={onChangeEndpoint}
                isFullWidth={!isEntityImmutable}
                isModal={isModal}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col w-full gap-4">
        <DialCheckbox
          checked={checkboxStates[SourceType.MCP_CONTAINER]}
          label={t(SourceI18nKey.McpContainer)}
          id={SourceType.MCP_CONTAINER}
          onChange={toggleCheckbox}
          disabled={
            isReadOnlyAdmin || (checkboxStates[SourceType.MCP_CONTAINER] && !checkboxStates[SourceType.ENDPOINT])
          }
        />

        {checkboxStates[SourceType.MCP_CONTAINER] && (
          <div className="h-full flex flex-col gap-y-3 pl-6">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
              <EndpointControl
                label=""
                id="mcp_endpoint"
                placeholder="Enter MCP endpoint"
                required
                disabled={isReadOnlyAdmin}
                endpoint={
                  view === ApplicationRoute.ApplicationRunners
                    ? (entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`]?.['dial:endpoint']
                    : (entity as DialApplication).mcp?.endpoint
                }
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
              value={TRANSPORTS[0].value}
              options={TRANSPORTS}
              containerClassName="max-w-[160px]"
              label={t(EntityFieldsI18nKey.Transport)}
              onChange={onChangeMCPTransport}
              disabled
            />
            {(view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) && (
              <div className={classNames(CONTROL_WITH_BUTTON_WIDTH)}>
                <DialLabel label={t(EntityFieldsI18nKey.allowedTools)} />
                {((entity as DialApplication)?.mcp?.allowedTools || []).map((item, index) => (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointAndMCPContainer;
