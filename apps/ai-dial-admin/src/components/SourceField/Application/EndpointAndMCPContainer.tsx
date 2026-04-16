'use client';
import { DialCheckbox, DialSelectField } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { ONLY_HTTP_TRANSPORTS } from '@/src/constants/transport';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

export enum SourceType {
  CHAT_ENDPOINT = 'chat_endpoint',
  MCP_ENDPOINT = 'mcp_endpoint',
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
        [SourceType.CHAT_ENDPOINT]: !!(entity as DialApplication)?.endpoint || !(entity as DialApplication)?.mcp,
        [SourceType.MCP_ENDPOINT]: !!(entity as DialApplication)?.mcp,
      };
    } else {
      return {
        [SourceType.CHAT_ENDPOINT]:
          !!(entity as DialApplicationScheme)?.['dial:applicationTypeCompletionEndpoint'] ||
          !(entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`],
        [SourceType.MCP_ENDPOINT]: !!(entity as DialApplicationScheme)?.[`dial:applicationTypeMcp`],
      };
    }
  });

  const t = useI18n();

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
      [SourceType.CHAT_ENDPOINT]: prev[SourceType.CHAT_ENDPOINT] || isEndpointExisting,
      [SourceType.MCP_ENDPOINT]: prev[SourceType.MCP_ENDPOINT] || isMCPContainerExisting,
    }));
  }, [entity, view]);

  const toggleCheckbox = useCallback(
    (value?: boolean, id?: string) => {
      if (id) {
        const newCheckboxStates = { ...checkboxStates, [id]: !!value };
        setCheckboxStates(newCheckboxStates);

        if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
          onChangeEntity({
            ...entity,
            endpoint: newCheckboxStates[SourceType.CHAT_ENDPOINT] ? (entity as DialApplication)?.endpoint : undefined,
            mcp: newCheckboxStates[SourceType.MCP_ENDPOINT] ? (entity as DialApplication)?.mcp : undefined,
          });
        } else if (view === ApplicationRoute.ApplicationRunners) {
          onChangeEntity({
            ...entity,
            ['dial:applicationTypeCompletionEndpoint']: newCheckboxStates[SourceType.CHAT_ENDPOINT]
              ? (entity as DialApplicationScheme)?.['dial:applicationTypeCompletionEndpoint']
              : undefined,
            [`dial:applicationTypeMcp`]: newCheckboxStates[SourceType.MCP_ENDPOINT]
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
        const updatedMCPContainer = {
          ...((entity as DialApplication)?.mcp || {}),
          endpoint: newMcpEndpoint || '',
        };
        onChangeEntity({ ...entity, mcp: updatedMCPContainer });
      } else if (view === ApplicationRoute.ApplicationRunners) {
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
        const selectedTransport =
          ONLY_HTTP_TRANSPORTS.find((source) => source.value === transportId) || ONLY_HTTP_TRANSPORTS[0];
        const updatedMCPContainer = {
          ...((entity as DialApplication).mcp || {}),
          endpoint: (entity as DialApplication).mcp?.endpoint || '',
          transport: selectedTransport.value,
        };
        onChangeEntity({ ...entity, mcp: updatedMCPContainer });
      } else if (view === ApplicationRoute.ApplicationRunners) {
        const selectedTransport =
          ONLY_HTTP_TRANSPORTS.find((source) => source.value === transportId) || ONLY_HTTP_TRANSPORTS[0];
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

  return (
    <div className="flex flex-col w-full gap-8 border border-primary rounded p-4">
      <div className="flex flex-col w-full gap-4">
        <DialCheckbox
          checked={checkboxStates[SourceType.CHAT_ENDPOINT]}
          label={t(SourceI18nKey.ChatEndpoint)}
          id={SourceType.CHAT_ENDPOINT}
          onChange={toggleCheckbox}
          disabled={
            isReadOnlyAdmin || (checkboxStates[SourceType.CHAT_ENDPOINT] && !checkboxStates[SourceType.MCP_ENDPOINT])
          }
        />

        {checkboxStates[SourceType.CHAT_ENDPOINT] && (
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
          checked={checkboxStates[SourceType.MCP_ENDPOINT]}
          label={t(SourceI18nKey.McpEndpoint)}
          id={SourceType.MCP_ENDPOINT}
          onChange={toggleCheckbox}
          disabled={
            isReadOnlyAdmin || (checkboxStates[SourceType.MCP_ENDPOINT] && !checkboxStates[SourceType.CHAT_ENDPOINT])
          }
        />

        {checkboxStates[SourceType.MCP_ENDPOINT] && (
          <div className="h-full flex flex-col gap-y-3 pl-6">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
              <EndpointControl
                label=""
                id="mcp_endpoint"
                placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
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
            </div>
            <DialSelectField
              id="transport"
              value={ONLY_HTTP_TRANSPORTS[0].value}
              options={ONLY_HTTP_TRANSPORTS}
              containerClassName="max-w-[160px]"
              label={t(EntityFieldsI18nKey.Transport)}
              onChange={onChangeMCPTransport}
              disabled
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointAndMCPContainer;
