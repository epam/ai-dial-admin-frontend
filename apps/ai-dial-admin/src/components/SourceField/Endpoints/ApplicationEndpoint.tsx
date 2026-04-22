'use client';
import { DialCheckbox, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';

import EditorUrlControl from '@/src/components/BaseControls/Endpoint/EditorUrl';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ViewerUrlControl from '@/src/components/BaseControls/Endpoint/ViewerUrl';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { CONTROL_WIDTH, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { ONLY_HTTP_TRANSPORTS } from '@/src/constants/transport';
import { useI18n } from '@/src/locales/client';
import { ApplicationMCPConfigDelivery, ApplicationMCPContainer, DialApplication } from '@/src/models/dial/application';

enum ApplicationEndpointCheckbox {
  CHAT_ENDPOINT = 'chat_endpoint',
  MCP_ENDPOINT = 'mcp_endpoint',
}

interface Props {
  entity: DialApplication;
  onChange: (entity: DialApplication) => void;
  isEntityImmutable?: boolean;
  isModal?: boolean;
  disabled?: boolean;
}

const ApplicationEndpoint: FC<Props> = ({ entity, onChange, isEntityImmutable, isModal, disabled }) => {
  const t = useI18n();

  const [checkboxStates, setCheckboxStates] = useState<Record<ApplicationEndpointCheckbox, boolean>>(() => ({
    [ApplicationEndpointCheckbox.CHAT_ENDPOINT]: !!entity?.endpoint || !entity?.mcp,
    [ApplicationEndpointCheckbox.MCP_ENDPOINT]: !!entity?.mcp,
  }));

  useEffect(() => {
    const isEndpointExisting = !!entity?.endpoint;
    const isMCPContainerExisting = !!entity?.mcp;
    setCheckboxStates((prev) => ({
      [ApplicationEndpointCheckbox.CHAT_ENDPOINT]:
        prev[ApplicationEndpointCheckbox.CHAT_ENDPOINT] || isEndpointExisting,
      [ApplicationEndpointCheckbox.MCP_ENDPOINT]:
        prev[ApplicationEndpointCheckbox.MCP_ENDPOINT] || isMCPContainerExisting,
    }));
  }, [entity]);

  const toggleCheckbox = useCallback(
    (value?: boolean, id?: string) => {
      if (!id) return;
      const newCheckboxStates = { ...checkboxStates, [id]: !!value };
      setCheckboxStates(newCheckboxStates);
      onChange({
        ...entity,
        endpoint: newCheckboxStates[ApplicationEndpointCheckbox.CHAT_ENDPOINT] ? entity?.endpoint : undefined,
        responsesEndpoint: newCheckboxStates[ApplicationEndpointCheckbox.CHAT_ENDPOINT]
          ? entity?.responsesEndpoint
          : undefined,
        mcp: newCheckboxStates[ApplicationEndpointCheckbox.MCP_ENDPOINT] ? entity?.mcp : undefined,
      });
    },
    [checkboxStates, entity, onChange],
  );

  const onChangeMCPEndpoint = useCallback(
    (newMcpEndpoint?: string) => {
      const updatedMCPContainer: ApplicationMCPContainer = {
        ...(entity?.mcp || {}),
        endpoint: newMcpEndpoint || '',
      };
      onChange({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChange],
  );

  const onChangeForwardPerRequestKey = useCallback(
    (newValue?: boolean) => {
      const updatedMCPContainer: ApplicationMCPContainer = {
        ...(entity?.mcp || { endpoint: '' }),
        forwardPerRequestKey: newValue,
      };
      onChange({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChange],
  );

  const onChangeMCPTransport = useCallback(
    (transportId: string | string[]) => {
      const selectedTransport =
        ONLY_HTTP_TRANSPORTS.find((source) => source.value === transportId) || ONLY_HTTP_TRANSPORTS[0];
      const updatedMCPContainer: ApplicationMCPContainer = {
        ...(entity?.mcp || {}),
        endpoint: entity?.mcp?.endpoint || '',
        transport: selectedTransport.value,
      };
      onChange({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChange],
  );

  const onChangeMCPConfigDelivery = useCallback(
    (configDeliveryId: string | string[]) => {
      const selectedConfigDelivery =
        Object.values(ApplicationMCPConfigDelivery).find((source) => source === configDeliveryId) ||
        Object.values(ApplicationMCPConfigDelivery)[0];
      const updatedMCPContainer: ApplicationMCPContainer = {
        ...(entity?.mcp || {}),
        endpoint: entity?.mcp?.endpoint || '',
        configDelivery: selectedConfigDelivery,
      };
      onChange({ ...entity, mcp: updatedMCPContainer });
    },
    [entity, onChange],
  );

  const onChangeViewerUrl = useCallback(
    (viewerUrl?: string) => {
      onChange({ ...entity, viewerUrl });
    },
    [entity, onChange],
  );

  const onChangeEditorUrl = useCallback(
    (editorUrl?: string) => {
      onChange({ ...entity, editorUrl });
    },
    [entity, onChange],
  );

  return (
    <div className="h-full flex flex-col gap-y-8">
      <div className="flex flex-col w-full gap-8 border border-primary rounded p-4">
        <div className="flex flex-col w-full gap-4">
          <DialCheckbox
            checked={checkboxStates[ApplicationEndpointCheckbox.CHAT_ENDPOINT]}
            label={t(SourceI18nKey.ChatEndpoint)}
            id={ApplicationEndpointCheckbox.CHAT_ENDPOINT}
            onChange={toggleCheckbox}
            disabled={
              disabled ||
              (checkboxStates[ApplicationEndpointCheckbox.CHAT_ENDPOINT] &&
                !checkboxStates[ApplicationEndpointCheckbox.MCP_ENDPOINT])
            }
          />

          {checkboxStates[ApplicationEndpointCheckbox.CHAT_ENDPOINT] && (
            <div className="w-full pl-6">
              <div className={classNames(CONTROL_WIDTH, 'flex flex-col gap-y-2')}>
                <EndpointControl
                  label={t(EntityFieldsI18nKey.completionEndpoint)}
                  id="completionEndpoint"
                  placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
                  required
                  disabled={disabled}
                  endpoint={entity?.endpoint}
                  onChange={(endpoint) => onChange({ ...entity, endpoint })}
                  isFullWidth={!isEntityImmutable}
                  isModal={isModal}
                />
                <EndpointControl
                  label={t(EntityFieldsI18nKey.responsesEndpoint)}
                  id="responsesEndpoint"
                  placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
                  disabled={disabled}
                  endpoint={entity?.responsesEndpoint}
                  onChange={(responsesEndpoint) => onChange({ ...entity, responsesEndpoint })}
                  isFullWidth={!isEntityImmutable}
                  isModal={isModal}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col w-full gap-4">
          <DialCheckbox
            checked={checkboxStates[ApplicationEndpointCheckbox.MCP_ENDPOINT]}
            label={t(SourceI18nKey.McpEndpoint)}
            id={ApplicationEndpointCheckbox.MCP_ENDPOINT}
            onChange={toggleCheckbox}
            disabled={
              disabled ||
              (checkboxStates[ApplicationEndpointCheckbox.MCP_ENDPOINT] &&
                !checkboxStates[ApplicationEndpointCheckbox.CHAT_ENDPOINT])
            }
          />

          {checkboxStates[ApplicationEndpointCheckbox.MCP_ENDPOINT] && (
            <div className="h-full flex flex-col gap-y-4 pl-6">
              <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
                <EndpointControl
                  label=""
                  id="mcp_endpoint"
                  placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
                  required
                  disabled={disabled}
                  endpoint={entity.mcp?.endpoint}
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

              <DialSwitch
                switchId="forwardPerRequestKey"
                isOn={entity.mcp?.forwardPerRequestKey}
                label={t(EntityFieldsI18nKey.forwardPerRequestKey)}
                onChange={onChangeForwardPerRequestKey}
                disabled={disabled}
              />

              <DialSelectField
                id="configDelivery"
                value={entity.mcp?.configDelivery}
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

      {isEntityImmutable && (
        <>
          <ViewerUrlControl endpoint={entity.viewerUrl} disabled={disabled} onChange={onChangeViewerUrl} />
          <EditorUrlControl endpoint={entity.editorUrl} disabled={disabled} onChange={onChangeEditorUrl} />
        </>
      )}
    </div>
  );
};

export default ApplicationEndpoint;
