import { FC, useCallback } from 'react';
import { DialSelectField } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { IMAGE_SOURCE_TYPE, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { setTransport } from '@/src/utils/deployments/images';
import { DEFAULT_IMAGE_SOURCE, IMAGE_TYPES, SOURCE_TYPES } from '@/src/constants/deployments/images';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { McpServer } from '@/src/types/deployments/mcp-registry';
import { mapImageTransportType } from '@/src/utils/deployments/mcp-registry';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  verifyVersion: (image: Image) => void;
  registryServer?: McpServer;
}

const hasRepo = (server: McpServer): boolean => !!server.repository?.url;
const hasOci = (server: McpServer): boolean => !!server.packages?.some((p) => p.registryType === 'oci');
const getFirstOciPackage = (server: McpServer) => server.packages?.find((p) => p.registryType === 'oci');

const SourceType: FC<Props> = ({ image, setImage, isModal, verifyVersion, registryServer }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const sourcesList = SOURCE_TYPES(t);
  const imageTypesList = IMAGE_TYPES(t);

  const isRegistryDisabled = registryServer ? !(hasRepo(registryServer) && hasOci(registryServer)) : false;

  const onImageTypeChange = useCallback(
    ($type: string | string[]) => {
      const updated = {
        ...setTransport({ ...image, $type: $type as IMAGE_TYPE }),
        $type: $type as IMAGE_TYPE,
        source: DEFAULT_IMAGE_SOURCE,
      };
      verifyVersion(updated);
      setImage(updated);
    },
    [image, setImage, verifyVersion],
  );

  const onSourceTypeChange = useCallback(
    ($type: string | string[]) => {
      const sourceType = $type as IMAGE_SOURCE_TYPE;

      if (registryServer) {
        const { externalRegistryRef } = image.source;

        if (sourceType === IMAGE_SOURCE_TYPE.CODE) {
          setImage({
            ...image,
            source: {
              $type: IMAGE_SOURCE_TYPE.CODE,
              url: registryServer.repository?.url || '',
              branchName: image.source?.branchName,
              sha: image.source?.sha,
              baseDirectory: image.source?.baseDirectory,
              externalRegistryRef,
            },
          });
        } else {
          const ociPackage = getFirstOciPackage(registryServer);
          const transportType = ociPackage?.transport?.type
            ? mapImageTransportType(ociPackage.transport.type)
            : IMAGE_TRANSPORT_TYPE.LOCAL;

          setImage({
            ...image,
            transportType,
            source: {
              $type: IMAGE_SOURCE_TYPE.DOCKER,
              imageUri: ociPackage?.identifier || '',
              externalRegistryRef,
            },
          });
        }
        return;
      }

      setImage({
        ...image,
        source: {
          $type: sourceType,
        },
      });
    },
    [image, setImage, registryServer],
  );

  return (
    <div className="flex gap-x-4">
      {isModal && (
        <DialSelectField
          id="imagesType"
          containerClassName="w-[220px]"
          value={image.$type}
          options={imageTypesList}
          label={t(EntityFieldsI18nKey.type)}
          onChange={onImageTypeChange}
          disabled={isReadOnlyAdmin}
        />
      )}
      {image.$type === IMAGE_TYPE.MCP && (
        <DialSelectField
          id="sourceType"
          containerClassName="w-[220px]"
          value={image.source.$type}
          options={sourcesList}
          label={t(EntitiesI18nKey.SourceType)}
          onChange={onSourceTypeChange}
          disabled={isReadOnlyAdmin || isRegistryDisabled}
        />
      )}
    </div>
  );
};

export default SourceType;
