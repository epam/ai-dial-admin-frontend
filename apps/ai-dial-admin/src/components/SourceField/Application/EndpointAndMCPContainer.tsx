'use client';
import { DialCheckbox, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { CONTROL_WIDTH, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { ONLY_HTTP_TRANSPORTS } from '@/src/constants/transport';
import { useI18n } from '@/src/locales/client';
import { ApplicationMCPConfigDelivery, ApplicationTypeMCP, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import AddTool from './AddTool';

export enum SourceType {
  CHAT_ENDPOINT = 'chat_endpoint',
  MCP_ENDPOINT = 'mcp_endpoint',
}

export interface Props {
  entity: DialApplicationScheme;
  /** Retained for call-site compatibility; no runtime branching. */
  view?: ApplicationRoute;
  isEntityImmutable?: boolean;
  isReadOnlyAdmin?: boolean;
  onChangeEntity: (entity: DialApplicationScheme) => void;
  isModal?: boolean;
}

const EndpointAndMCPContainer: FC<Props> = ({
  entity,
  onChangeEntity,
  isEntityImmutable,
  isReadOnlyAdmin,
  isModal,
}) => {
  const [checkboxStates, setCheckboxStates] = useState<Record<SourceType, boolean>>(() => ({
    [SourceType.CHAT_ENDPOINT]:
      !!entity?.['dial:applicationTypeCompletionEndpoint'] || !entity?.['dial:applicationTypeMcp'],
    [SourceType.MCP_ENDPOINT]: !!entity?.['dial:applicationTypeMcp'],
  }));

  const t = useI18n();

  useEffect(() => {
    const isEndpointExisting = !!entity?.['dial:applicationTypeCompletionEndpoint'];
    const isMCPContainerExisting = !!entity?.['dial:applicationTypeMcp'];
    setCheckboxStates((prev) => ({
      [SourceType.CHAT_ENDPOINT]: prev[SourceType.CHAT_ENDPOINT] || isEndpointExisting,
      [SourceType.MCP_ENDPOINT]: prev[SourceType.MCP_ENDPOINT] || isMCPContainerExisting,
    }));
  }, [entity]);

  const toggleCheckbox = useCallback(
    (value?: boolean, id?: string) => {
      if (!id) return;
      const newCheckboxStates = { ...checkboxStates, [id]: !!value };
      setCheckboxStates(newCheckboxStates);

      onChangeEntity({
        ...entity,
        ['dial:applicationTypeCompletionEndpoint']: newCheckboxStates[SourceType.CHAT_ENDPOINT]
          ? entity?.['dial:applicationTypeCompletionEndpoint']
          : undefined,
        ['dial:applicationTypeResponsesEndpoint']: newCheckboxStates[SourceType.CHAT_ENDPOINT]
          ? entity?.['dial:applicationTypeResponsesEndpoint']
          : undefined,
        ['dial:applicationTypeMcp']: newCheckboxStates[SourceType.MCP_ENDPOINT]
          ? entity?.['dial:applicationTypeMcp']
          : undefined,
      });
    },
    [checkboxStates, entity, onChangeEntity],
  );

  const onChangeCompletionEndpoint = useCallback(
    (endpoint?: string) => {
      onChangeEntity({ ...entity, 'dial:applicationTypeCompletionEndpoint': endpoint });
    },
    [entity, onChangeEntity],
  );

  const onChangeResponsesEndpoint = useCallback(
    (endpoint?: string) => {
      onChangeEntity({ ...entity, 'dial:applicationTypeResponsesEndpoint': endpoint });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPEndpoint = useCallback(
    (newMcpEndpoint?: string) => {
      const updatedMCPContainer: ApplicationTypeMCP = {
        ...(entity?.['dial:applicationTypeMcp'] || {}),
        ['dial:endpoint']: newMcpEndpoint || '',
      };
      onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onChangeForwardPerRequestKey = useCallback(
    (newValue?: boolean) => {
      const updatedMCPContainer: ApplicationTypeMCP = {
        ...(entity?.['dial:applicationTypeMcp'] || { ['dial:endpoint']: '' }),
        ['dial:forwardPerRequestKey']: newValue,
      };
      onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPTransport = useCallback(
    (transportId: string | string[]) => {
      const selectedTransport =
        ONLY_HTTP_TRANSPORTS.find((source) => source.value === transportId) || ONLY_HTTP_TRANSPORTS[0];
      const updatedMCPContainer: ApplicationTypeMCP = {
        ...(entity?.['dial:applicationTypeMcp'] || {}),
        ['dial:endpoint']: entity?.['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
        ['dial:transport']: selectedTransport.value,
      };
      onChangeEntity({ ...entity, ['dial:applicationTypeMcp']: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPConfigDelivery = useCallback(
    (configDeliveryId: string | string[]) => {
      const selectedConfigDelivery =
        Object.values(ApplicationMCPConfigDelivery).find((source) => source === configDeliveryId) ||
        Object.values(ApplicationMCPConfigDelivery)[0];
      const updatedMCPContainer: ApplicationTypeMCP = {
        ...(entity?.['dial:applicationTypeMcp'] || {}),
        ['dial:endpoint']: entity?.['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
        ['dial:mcpConfigDelivery']: selectedConfigDelivery,
      };
      onChangeEntity({ ...entity, ['dial:applicationTypeMcp']: updatedMCPContainer });
    },
    [entity, onChangeEntity],
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
            <div className={classNames(CONTROL_WIDTH, 'flex flex-col gap-y-2')}>
              <EndpointControl
                label={t(EntityFieldsI18nKey.completionEndpoint)}
                id="completionEndpoint"
                placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
                required
                disabled={isReadOnlyAdmin}
                endpoint={entity?.['dial:applicationTypeCompletionEndpoint']}
                onChange={onChangeCompletionEndpoint}
                isFullWidth={!isEntityImmutable}
                isModal={isModal}
              />
              <EndpointControl
                label={t(EntityFieldsI18nKey.responsesEndpoint)}
                id="responsesEndpoint"
                placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
                disabled={isReadOnlyAdmin}
                endpoint={entity?.['dial:applicationTypeResponsesEndpoint']}
                onChange={onChangeResponsesEndpoint}
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
          <div className="h-full flex flex-col gap-y-4 pl-6">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
              <EndpointControl
                label=""
                id="mcp_endpoint"
                placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
                required
                disabled={isReadOnlyAdmin}
                endpoint={entity?.['dial:applicationTypeMcp']?.['dial:endpoint']}
                onChange={onChangeMCPEndpoint}
                isFullWidth={!isEntityImmutable}
                isModal={isModal}
              />
            </div>

            <AddTool entity={entity} onChangeEntity={onChangeEntity} />

            <DialSelectField
              id="transport"
              value={ONLY_HTTP_TRANSPORTS[0].value}
              options={ONLY_HTTP_TRANSPORTS}
              containerClassName="max-w-[160px]"
              label={t(EntityFieldsI18nKey.Transport)}
              onChange={onChangeMCPTransport}
              disabled
            />

            <DialSwitch
              switchId="forwardPerRequestKey"
              isOn={entity?.['dial:applicationTypeMcp']?.['dial:forwardPerRequestKey']}
              label={t(EntityFieldsI18nKey.forwardPerRequestKey)}
              onChange={onChangeForwardPerRequestKey}
              disabled={isReadOnlyAdmin}
            />

            <DialSelectField
              id="configDelivery"
              value={entity?.['dial:applicationTypeMcp']?.['dial:mcpConfigDelivery']}
              options={Object.values(ApplicationMCPConfigDelivery).map((value) => ({
                value,
                label: value,
              }))}
              containerClassName="max-w-[160px]"
              label={t(EntityFieldsI18nKey.configDelivery)}
              onChange={onChangeMCPConfigDelivery}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointAndMCPContainer;
