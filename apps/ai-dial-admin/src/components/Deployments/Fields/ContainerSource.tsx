import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { getDeploymentsURIError } from '@/src/utils/deployments/validation';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { getControlClassName } from '@/src/utils/entities/view';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import HFModelNameField from '@/src/components/Deployments/Fields/ContainerSource/HFModelNameField';
import McpServerNameField from '@/src/components/Deployments/Fields/ContainerSource/McpServerNameField';
import { getContainerMcpServers } from '@/src/app/actions/deployments';
import { getPreferredOciPackage, mapTransportType } from '@/src/utils/deployments/mcp-registry';
import { McpServer } from '@/src/types/deployments/mcp-registry';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  route: ApplicationRoute;
  disabled?: boolean;
}

const ContainerSource: FC<Props> = ({ container, setContainer, isModal = false, route, disabled }) => {
  const isDisabled = disabled ?? isEditDisabled(container);
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const [imageRefError, setImageRefError] = useState<FieldError | null>(null);
  const [imageReferenceError, setImageReferenceError] = useState<FieldError | null>(null);

  const mcpServerName = container.source?.externalRegistryRef?.packageName || '';

  const onContainerServerSelect = useCallback(
    (server: McpServer) => {
      const preferredPackage = getPreferredOciPackage(server);
      const ociIdentifier = preferredPackage?.identifier;
      const transport = preferredPackage?.transport?.type
        ? mapTransportType(preferredPackage.transport.type)
        : undefined;

      setContainer({
        ...container,
        ...(transport ? { transport } : {}),
        source: {
          ...container.source,
          imageReference: ociIdentifier || '',
          externalRegistryRef: {
            $type: 'mcp-registry',
            packageName: server.name,
            version: server.version,
          },
        },
      });
    },
    [container, setContainer],
  );

  const onContainerServerNameChange = useCallback(
    (name: string) => {
      setContainer({
        ...container,
        source: {
          ...container.source,
          imageReference: '',
          externalRegistryRef: { $type: 'mcp-registry', packageName: name },
        },
      });
    },
    [container, setContainer],
  );

  const onChangeImageRef = useCallback(
    (value?: string) => {
      const error = getDeploymentsURIError(value, t);
      setImageRefError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelSourceName',
        isValid: !error,
      });
      setContainer({ ...container, source: { ...container.source, imageRef: value } });
    },
    [t, dispatch, setContainer, container],
  );

  const onChangeImageReference = useCallback(
    (value?: string) => {
      const error = getDeploymentsURIError(value, t);
      setImageReferenceError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelSourceName',
        isValid: !error,
      });
      setContainer({ ...container, source: { ...container.source, imageReference: value } });
    },
    [t, dispatch, setContainer, container],
  );

  useEffect(() => {
    if (resetCounter || (container.source?.imageRef && container.source?.imageRef.length > 0)) {
      const error = getDeploymentsURIError(container.source?.imageRef, t);
      setImageRefError(error);
    }
  }, [container.source?.imageRef, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || (container.source?.imageReference && container.source?.imageReference.length > 0)) {
      const error = getDeploymentsURIError(container.source?.imageReference, t);
      setImageReferenceError(error);
    }
  }, [container.source?.imageReference, resetCounter, t]);

  useEffect(() => {
    const sourceType = container.source?.$type;
    if (sourceType === CONTAINER_SOURCE_TYPE.NGC_REGISTRY) {
      const error = getDeploymentsURIError(container.source?.imageRef);
      dispatch({ type: ValidationActionType.SetField, field: 'modelSourceName', isValid: !error });
    } else if (sourceType === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE && !container.source?.externalRegistryRef) {
      const error = getDeploymentsURIError(container.source?.imageReference);
      dispatch({ type: ValidationActionType.SetField, field: 'modelSourceName', isValid: !error });
    }
  }, [
    container.source?.$type,
    container.source?.imageRef,
    container.source?.imageReference,
    container.source?.externalRegistryRef,
    dispatch,
  ]);

  const renderSourceField = () => {
    switch (container.source?.$type) {
      case CONTAINER_SOURCE_TYPE.NGC_REGISTRY:
        return (
          <DialInput
            id="imageRef"
            labelProps={{ label: t(EntityFieldsI18nKey.ImageURI), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.URI)}
            value={container.source?.imageRef}
            error={imageRefError?.text}
            invalid={!!imageRefError}
            onChange={onChangeImageRef}
            containerClassName={containerClassName}
            disabled={isDisabled}
          />
        );
      case CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE:
        if (container.source?.externalRegistryRef) {
          return (
            <McpServerNameField
              fetchServers={getContainerMcpServers}
              onServerSelect={onContainerServerSelect}
              serverName={mcpServerName}
              onServerNameChange={onContainerServerNameChange}
              preselectedServer={
                container.source?.externalRegistryRef
                  ? {
                      name: container.source.externalRegistryRef.packageName,
                      version: container.source.externalRegistryRef.version || '',
                    }
                  : undefined
              }
              view={route}
              isModal={isModal}
              disabled={isDisabled || container.status === CONTAINER_STATUS.RUNNING}
            />
          );
        }
        return (
          <DialInput
            id="imageReference"
            labelProps={{ label: t(EntityFieldsI18nKey.DockerImageReference), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.URI)}
            value={container.source?.imageReference}
            error={imageReferenceError?.text}
            invalid={!!imageReferenceError}
            onChange={onChangeImageReference}
            containerClassName={containerClassName}
            disabled={isDisabled}
          />
        );
      default:
        return (
          <HFModelNameField
            container={container}
            setContainer={setContainer}
            isModal={isModal}
            route={route}
            disabled={isDisabled}
          />
        );
    }
  };

  return <div className="flex flex-col gap-y-8">{renderSourceField()}</div>;
};

export default ContainerSource;
