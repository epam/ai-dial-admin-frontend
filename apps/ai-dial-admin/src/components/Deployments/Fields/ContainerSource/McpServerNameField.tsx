import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getErrorForMcpServerName } from '@/src/utils/deployments/validation';
import { ErrorType } from '@/src/types/error-type';
import { debounce } from 'lodash';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { createPortal } from 'react-dom';
import McpRegistryModal from '@/src/components/Deployments/Modals/McpRegistryModal/McpRegistryModal';
import classNames from 'classnames';
import { McpRegistryFetchFn, McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';

interface Props {
  fetchServers: McpRegistryFetchFn;
  onServerSelect: (server: McpServer) => void;
  serverName: string;
  onServerNameChange: (name: string) => void;
  isModal?: boolean;
  disabled?: boolean;
}

const McpServerNameField: FC<Props> = ({
  fetchServers,
  onServerSelect,
  serverName,
  onServerNameChange,
  isModal,
  disabled,
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);
  const [serverCache, setServerCache] = useState<Map<string, McpServer>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [serverNameError, setServerNameError] = useState<FieldError | null>(null);

  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const applyServer = useCallback(
    (server: McpServer) => {
      const error = getErrorForMcpServerName(server.name, t);
      setServerNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'mcpServerName',
        isValid: !error,
      });

      onServerSelect(server);
    },
    [onServerSelect, dispatch, t],
  );

  const validateAndApplyServer = useCallback(
    (value: string) => {
      fetchServers({ search: value, limit: 10 }).then(({ success, response }) => {
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
    [t, dispatch, applyServer, fetchServers],
  );

  const onChangeServerName = useCallback(
    (value?: string) => {
      const formatError = getErrorForMcpServerName(value, t);
      if (formatError) {
        setServerNameError(formatError);
        dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
        onServerNameChange(value || '');
        return;
      }

      const cached = serverCache.get(value || '');
      if (cached) {
        applyServer(cached);
      } else {
        setServerNameError(null);
        dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
        onServerNameChange(value || '');
        validateAndApplyServer(value || '');
      }
    },
    [dispatch, t, serverCache, applyServer, validateAndApplyServer, onServerNameChange],
  );

  const onServerNameType = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length <= 2) {
          setServerOptions([]);
          return;
        }
        fetchServers({ search: value, limit: 5 }).then(({ success, response }) => {
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
    [fetchServers],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (resetCounter || (serverName && serverName.length > 0)) {
      const error = getErrorForMcpServerName(serverName, t);
      setServerNameError(error);
    }
  }, [serverName, resetCounter, t]);

  useEffect(() => {
    const error = getErrorForMcpServerName(serverName, t);
    dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: !error });
  }, [serverName, dispatch, t]);

  return (
    <>
      <div className="flex gap-3">
        <DialSelectField
          id="mcpServerName"
          label={t(EntityFieldsI18nKey.McpServerName)}
          required
          placeholder={t(EntityPlaceholdersI18nKey.McpServerName)}
          inlineSearch={true}
          value={serverName}
          customSelectedValue={serverName}
          onChange={(value) => onChangeServerName(value as string)}
          onInlineQueryChange={(value) => onServerNameType(value)}
          options={serverOptions}
          error={serverNameError?.text}
          containerClassName={containerClassName}
          disabled={disabled}
        />
        <DialNeutralButton
          onClick={handleModalOpen}
          label={t(ButtonsI18nKey.McpRegistry)}
          iconBefore={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
          className={classNames(serverNameError?.text ? 'self-center mb-1' : 'self-end', 'shrink-0')}
          disabled={disabled}
        />
      </div>
      {isModalOpen &&
        createPortal(
          <McpRegistryModal
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={(server) => applyServer(server)}
            fetchServers={fetchServers}
          />,
          document.body,
        )}
    </>
  );
};

export default McpServerNameField;
