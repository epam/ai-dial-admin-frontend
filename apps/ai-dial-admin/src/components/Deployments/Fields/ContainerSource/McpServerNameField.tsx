import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getErrorForMcpServerName } from '@/src/utils/deployments/validation';
import { ErrorType } from '@/src/types/error-type';
import { getPreferredOciPackage, mapTransportType } from '@/src/utils/deployments/mcp-registry';
import { debounce } from 'lodash';
import { getContainerMcpServers } from '@/src/app/actions/deployments';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { createPortal } from 'react-dom';
import McpRegistryModal from '@/src/components/Deployments/Modals/McpRegistryModal/McpRegistryModal';
import classNames from 'classnames';
import { McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  disabled?: boolean;
}

const McpServerNameField: FC<Props> = ({ container, setContainer, isModal, disabled }) => {
  const t = useI18n();
  const isDisabled = (disabled ?? isEditDisabled(container)) || container.status === CONTAINER_STATUS.RUNNING;
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);
  const [serverCache, setServerCache] = useState<Map<string, McpServer>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [serverNameError, setServerNameError] = useState<FieldError | null>(null);

  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const currentServerName = container.source?.externalRegistryRef?.packageName || '';

  const applyServer = useCallback(
    (server: McpServer) => {
      const preferredPackage = getPreferredOciPackage(server);
      const ociIdentifier = preferredPackage?.identifier;
      const transport = preferredPackage?.transport?.type
        ? mapTransportType(preferredPackage.transport.type)
        : undefined;

      const error = getErrorForMcpServerName(server.name, t);
      setServerNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'mcpServerName',
        isValid: !error,
      });

      setContainer({
        ...container,
        ...(transport ? { transport } : {}),
        source: {
          ...container.source,
          imageReference: ociIdentifier || '',
          externalRegistryRef: {
            $type: 'mcp-registry',
            packageName: server.name,
          },
        },
      });
    },
    [container, setContainer, dispatch, t],
  );

  const validateAndApplyServer = useCallback(
    (value: string) => {
      getContainerMcpServers({ search: value, limit: 10 }).then(({ success, response }) => {
        if (!success) return;

        const servers = (response.servers || []).map((s: McpServerResponse) => s.server) as McpServer[];
        const exactMatch = servers.find((s) => s.name === value);

        if (!exactMatch) {
          const error = { type: ErrorType.INVALID, text: t(ErrorI18nKey.McpServerNotFound) };
          setServerNameError(error);
          dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
          return;
        }

        setServerCache((prev) => new Map(prev).set(value, exactMatch));
        applyServer(exactMatch);
      });
    },
    [t, dispatch, applyServer],
  );

  const onChangeServerName = useCallback(
    (value?: string) => {
      const formatError = getErrorForMcpServerName(value, t);
      if (formatError) {
        setServerNameError(formatError);
        dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
        setContainer({
          ...container,
          source: {
            ...container.source,
            externalRegistryRef: { $type: 'mcp-registry', packageName: value || '' },
          },
        });
        return;
      }

      const cached = serverCache.get(value || '');
      if (cached) {
        applyServer(cached);
      } else {
        // Clear imageReference and block Save while fetching
        setServerNameError(null);
        dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
        setContainer({
          ...container,
          source: {
            ...container.source,
            imageReference: '',
            externalRegistryRef: { $type: 'mcp-registry', packageName: value || '' },
          },
        });
        validateAndApplyServer(value || '');
      }
    },
    [container, setContainer, dispatch, t, serverCache, applyServer, validateAndApplyServer],
  );

  const onServerNameType = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length <= 2) {
          setServerOptions([]);
          return;
        }
        getContainerMcpServers({ search: value, limit: 5 }).then(({ success, response }) => {
          if (success) {
            const servers = (response.servers || []).map((s: McpServerResponse) => s.server) as McpServer[];
            if (servers.length) {
              setServerOptions(servers.map((s) => ({ value: s.name, label: s.name })));
              setServerCache((prev) => {
                const next = new Map(prev);
                servers.forEach((s) => next.set(s.name, s));
                return next;
              });
            }
          }
        });
      }, 100),
    [],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (resetCounter || (currentServerName && currentServerName.length > 0)) {
      const error = getErrorForMcpServerName(currentServerName, t);
      setServerNameError(error);
    }
  }, [currentServerName, resetCounter, t]);

  useEffect(() => {
    const error = getErrorForMcpServerName(currentServerName, t);
    dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: !error });
  }, [currentServerName, dispatch, t]);

  return (
    <>
      <div className="flex gap-3">
        <DialSelectField
          id="mcpServerName"
          label={t(EntityFieldsI18nKey.McpServerName)}
          required
          placeholder={t(EntityPlaceholdersI18nKey.McpServerName)}
          inlineSearch={true}
          value={currentServerName}
          customSelectedValue={currentServerName}
          onChange={(value) => onChangeServerName(value as string)}
          onInlineQueryChange={(value) => onServerNameType(value)}
          options={serverOptions}
          error={serverNameError?.text}
          containerClassName={containerClassName}
          disabled={isDisabled}
        />
        <DialNeutralButton
          onClick={handleModalOpen}
          label={t(ButtonsI18nKey.McpRegistry)}
          iconBefore={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
          className={classNames(serverNameError?.text ? 'self-center mb-1' : 'self-end', 'shrink-0')}
          disabled={isDisabled}
        />
      </div>
      {isModalOpen &&
        createPortal(
          <McpRegistryModal
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={(server) => applyServer(server)}
            fetchServers={getContainerMcpServers}
          />,
          document.body,
        )}
    </>
  );
};

export default McpServerNameField;
