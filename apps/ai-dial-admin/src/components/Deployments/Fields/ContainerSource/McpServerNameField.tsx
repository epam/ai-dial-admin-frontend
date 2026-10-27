import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { OutlinedButton } from '@epam/ai-dial-ui-kit';
import AutocompleteInput from '@/src/components/Common/AutocompleteInput/AutocompleteInput';
import { FIELD_ALIGNED_BUTTON_CLASS_NAME } from '@/src/components/Deployments/Fields/ContainerSource/constants';
import { AutocompleteInputOption } from '@/src/components/Common/AutocompleteInput/models';
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
import { McpRegistryFetchFn, McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';
import { ApplicationRoute } from '@/src/types/routes';
import { MCP_REGISTRY_PAGE_SIZE } from '@/src/constants/deployments/mcp-registry';

// The backend applies the container/image filter page by page and stops after a fixed number of
// upstream pages, so `limit` is also how much of the registry it scans: a page of 5 left most searches
// with no match. Both requests ask for a full registry page and the field shows the first few.
const SUGGESTION_COUNT = 5;

interface Props {
  fetchServers: McpRegistryFetchFn;
  onServerSelect: (server: McpServer) => void;
  serverName: string;
  onServerNameChange: (name: string) => void;
  preselectedServer?: Pick<McpServer, 'name' | 'version'>;
  view: ApplicationRoute;
  isModal?: boolean;
  disabled?: boolean;
}

const McpServerNameField: FC<Props> = ({
  fetchServers,
  onServerSelect,
  serverName,
  preselectedServer,
  view,
  onServerNameChange,
  isModal,
  disabled,
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [serverOptions, setServerOptions] = useState<AutocompleteInputOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // A typed name reaches `onChangeServerName` only when the field is left or a suggestion is picked.
  const [serverNameText, setServerNameText] = useState(serverName);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const latestQueryRef = useRef('');

  useEffect(() => {
    setServerNameText(serverName);
  }, [serverName]);

  const [serverNameError, setServerNameError] = useState<FieldError | null>(null);

  // The identity (name, plus version when known) the user currently intends. A
  // registry lookup is async, so its response may arrive after the user has changed
  // or cleared the input — or picked a different version of the same name. We compare
  // against this ref to drop such stale responses (Issue #3053). Keyed on
  // `name@version` so two same-name/different-version lookups stay distinguishable.
  const latestIntentRef = useRef(serverName);

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
    (name: string, version?: string) => {
      const intentKey = version ? `${name}@${version}` : name;
      fetchServers({ search: name, limit: MCP_REGISTRY_PAGE_SIZE }).then(({ success, response }) => {
        if (!success) return;
        // Drop the response if the user has since changed/cleared the input, or
        // picked a different version of the same name.
        if (latestIntentRef.current !== intentKey) return;

        const servers = (response.servers || []).map((s: McpServerResponse) => s.server) as McpServer[];
        const exactMatch = version
          ? servers.find((s) => s.name === name && s.version === version)
          : servers.find((s) => s.name === name);

        if (!exactMatch) {
          const error = { type: ErrorType.INVALID, text: t(ErrorI18nKey.McpServerNotFound) };
          setServerNameError(error);
          dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
          return;
        }

        applyServer(exactMatch);
      });
    },
    [t, dispatch, applyServer, fetchServers],
  );

  const onChangeServerName = useCallback(
    (value?: string) => {
      const raw = value || '';
      const atIndex = raw.indexOf('@');
      const isTypeaheadPick = atIndex >= 0;
      const name = isTypeaheadPick ? raw.slice(0, atIndex) : raw;
      const version = isTypeaheadPick ? raw.slice(atIndex + 1) : undefined;
      latestIntentRef.current = version ? `${name}@${version}` : name;

      const formatError = getErrorForMcpServerName(name, t);
      if (formatError) {
        setServerNameError(formatError);
        dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
        onServerNameChange(name);
        return;
      }

      setServerNameError(null);
      dispatch({ type: ValidationActionType.SetField, field: 'mcpServerName', isValid: false });
      if (!isTypeaheadPick) {
        onServerNameChange(name);
      }
      validateAndApplyServer(name, version);
    },
    [dispatch, t, validateAndApplyServer, onServerNameChange],
  );

  const onServerNameType = useMemo(
    () =>
      debounce(async (value: string) => {
        latestQueryRef.current = value;
        if (value.length <= 2) {
          setServerOptions([]);
          setIsLoadingServers(false);
          return;
        }
        setIsLoadingServers(true);
        try {
          const { success, response } = await fetchServers({ search: value, limit: MCP_REGISTRY_PAGE_SIZE });
          // A slower response for an earlier query must not replace the current one's suggestions.
          if (latestQueryRef.current !== value) return;
          const servers = success
            ? ((response.servers || []).map((s: McpServerResponse) => s.server) as McpServer[])
            : [];
          setServerOptions(
            servers
              .slice(0, SUGGESTION_COUNT)
              .map((s) => ({ value: `${s.name}@${s.version}`, label: s.name, description: s.version })),
          );
        } finally {
          if (latestQueryRef.current === value) {
            setIsLoadingServers(false);
          }
        }
      }, 100),
    [fetchServers],
  );

  const onServerNameTextChange = useCallback(
    (text: string) => {
      setServerNameText(text);
      // Record intent synchronously so an in-flight lookup that resolves after this
      // change is recognised as stale; the options fetch stays debounced.
      latestIntentRef.current = text;
      onServerNameType(text);
    },
    [onServerNameType],
  );

  const onPickServer = useCallback(
    (option: AutocompleteInputOption) => {
      setServerNameText(option.label);
      onChangeServerName(option.value);
    },
    [onChangeServerName],
  );

  const onCommitServerName = useCallback(
    (text: string) => {
      // Leaving the field untouched must not re-resolve an applied server by name alone, which
      // would swap its version for whichever one the registry lists first.
      if (text === serverName) {
        return;
      }
      onChangeServerName(text);
    },
    [onChangeServerName, serverName],
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
    return () => dispatch({ type: ValidationActionType.RemoveField, field: 'mcpServerName' });
  }, [serverName, dispatch, t]);

  return (
    <>
      <div className="flex items-start gap-3 w-full">
        <AutocompleteInput
          id="mcpServerName"
          labelProps={{ label: t(EntityFieldsI18nKey.McpServerName), required: true }}
          placeholder={t(EntityPlaceholdersI18nKey.McpServerName)}
          value={serverNameText}
          suggestions={serverOptions}
          isLoading={isLoadingServers}
          shouldFilterSuggestions={false}
          openOnFocus
          onChange={onServerNameTextChange}
          onSelect={onPickServer}
          onCommit={onCommitServerName}
          error={serverNameError?.text}
          invalid={!!serverNameError?.text}
          className={containerClassName}
          disabled={disabled}
        />
        <OutlinedButton
          onClick={handleModalOpen}
          label={t(ButtonsI18nKey.McpRegistry)}
          iconBefore={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
          className={FIELD_ALIGNED_BUTTON_CLASS_NAME}
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
            preselectedServer={preselectedServer}
            view={view}
          />,
          document.body,
        )}
    </>
  );
};

export default McpServerNameField;
