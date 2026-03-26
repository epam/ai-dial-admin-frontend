'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialCheckbox, DialLabel, DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';

import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ButtonsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { IconExternalLink } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import classNames from 'classnames';
import { ApplicationRoute } from '@/src/types/routes';
import { TRANSPORTS } from '@/src/components/SourceField/Application/constants';

export enum SourceType {
  ENDPOINT = 'endpoint',
  MCP_CONTEINER = 'mcp',
}

export interface Props {
  entity: DialApplicationScheme;
  isEntityImmutable?: boolean;
  isReadOnlyAdmin?: boolean;
  onChangeEntity: (entity: DialApplicationScheme) => void;
  isModal?: boolean;
}

const AppRunnerSource: FC<Props> = ({ entity, onChangeEntity, isEntityImmutable, isReadOnlyAdmin, isModal }) => {
  const [checkboxStates, setCheckboxStates] = useState<Record<SourceType, boolean>>({
    [SourceType.ENDPOINT]: !!entity?.['dial:applicationTypeCompletionEndpoint'] || !entity?.[`dial:applicationTypeMcp`],
    [SourceType.MCP_CONTEINER]: !!entity?.[`dial:applicationTypeMcp`],
  });
  const [mcpEndpoint, setMcpEndpoint] = useState<string | null>(null);
  const t = useI18n();
  const isMobile = useIsMobileScreen();
  const currentLocale = useCurrentLocale();

  useEffect(() => {
    const isEndpointExisting = !!entity?.['dial:applicationTypeCompletionEndpoint'];
    const isMCPContainerExisting = !!entity?.[`dial:applicationTypeMcp`];
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
          ['dial:applicationTypeCompletionEndpoint']: newCheckboxStates[SourceType.ENDPOINT]
            ? entity?.['dial:applicationTypeCompletionEndpoint']
            : undefined,
          [`dial:applicationTypeMcp`]: newCheckboxStates[SourceType.MCP_CONTEINER]
            ? entity?.[`dial:applicationTypeMcp`]
            : undefined,
        });
      }
    },
    [checkboxStates, entity, onChangeEntity],
  );

  const onChangeEndpoint = useCallback(
    (endpoint?: string) => {
      onChangeEntity({ ...entity, 'dial:applicationTypeCompletionEndpoint': endpoint });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPEndpoint = useCallback(
    (newMcpEndpoint?: string) => {
      setMcpEndpoint(newMcpEndpoint || null);
      const updatedMCPContainer = {
        ...(entity?.[`dial:applicationTypeMcp`] || {}),
        ['dial:endpoint']: newMcpEndpoint || '',
      };
      onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onChangeMCPTransport = useCallback(
    (transportId: string | string[]) => {
      const selectedTransport = TRANSPORTS.find((source) => source.value === transportId) || TRANSPORTS[0];
      const updatedMCPContainer = {
        ...(entity?.['dial:applicationTypeMcp'] || {}),
        ['dial:endpoint']: entity?.['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
        ['dial:transport']: selectedTransport.value,
      };
      onChangeEntity({ ...entity, ['dial:applicationTypeMcp']: updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const openInNewTab = useCallback(() => {
    window.open(`/${currentLocale}${ApplicationRoute.McpContainers}/${encodeURIComponent(`${mcpEndpoint}`)}`, '_blank');
  }, [currentLocale, mcpEndpoint]);

  return (
    <div className="flex flex-col w-full gap-2">
      <DialLabel label={t(EntitiesI18nKey.SourceType)} />
      <div className="flex flex-col w-full gap-8 border border-primary rounded p-4">
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
              <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-row gap-x-2')}>
                <EndpointControl
                  label=""
                  id="endpoint"
                  placeholder="Enter endpoint"
                  required
                  disabled={isReadOnlyAdmin}
                  endpoint={entity?.['dial:applicationTypeCompletionEndpoint']}
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
                  endpoint={entity?.[`dial:applicationTypeMcp`]?.['dial:endpoint']}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppRunnerSource;
