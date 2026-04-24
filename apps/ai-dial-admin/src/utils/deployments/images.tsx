import { SelectOption } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';
import { STATUS_CLASSNAMES } from '@/src/constants/deployments/images';
import {
  IMAGE_BUILDER_TYPE,
  IMAGE_SOURCE_TYPE,
  IMAGE_STATUS,
  IMAGE_TRANSPORT_TYPE,
  IMAGE_TYPE,
} from '@/src/types/deployments/images';
import { CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { Image, ImageGroup, ImageSource, ImageVersion } from '@/src/models/deployments/images';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

export const METADATA_ONLY_IMAGE_FIELDS: readonly (keyof Image)[] = ['description', 'author', 'topics'] as const;

export const hasOnlyMetadataChanges = (original: Image, edited: Image): boolean => {
  const keys = new Set<keyof Image>([
    ...(Object.keys(original) as (keyof Image)[]),
    ...(Object.keys(edited) as (keyof Image)[]),
  ]);
  for (const key of keys) {
    if (METADATA_ONLY_IMAGE_FIELDS.includes(key)) continue;
    if (!isEqual(original[key], edited[key])) return false;
  }
  return true;
};

import StatusIcon from '@/src/components/Deployments/Common/StatusIndicator/StatusIcon';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

export function isImageNotInstalled(image?: Image): boolean {
  return image?.buildStatus === IMAGE_STATUS.NOT_BUILT || image?.buildStatus === IMAGE_STATUS.BUILD_FAILED;
}

export function getActionClass(action: IMAGE_STATUS | CONTAINER_STATUS): string {
  return STATUS_CLASSNAMES[action];
}

export function getImageType(route: ApplicationRoute): string {
  switch (route) {
    case ApplicationRoute.InterceptorContainers:
      return 'INTERCEPTOR';
    case ApplicationRoute.McpContainers:
      return 'MCP';
    case ApplicationRoute.AdapterContainers:
      return 'ADAPTER';
    case ApplicationRoute.ApplicationContainers:
      return 'APPLICATION';
    default:
      return '';
  }
}

export const getContainerTypeByImageType = (type: IMAGE_TYPE): CONTAINER_TYPE => {
  switch (type) {
    case IMAGE_TYPE.MCP:
      return CONTAINER_TYPE.MCP;
    case IMAGE_TYPE.INTERCEPTOR:
      return CONTAINER_TYPE.INTERCEPTOR;
    case IMAGE_TYPE.ADAPTER:
      return CONTAINER_TYPE.ADAPTER;
    case IMAGE_TYPE.APPLICATION:
      return CONTAINER_TYPE.APPLICATION;
    default:
      return CONTAINER_TYPE.MCP;
  }
};

export const isValidVersion = (imageData?: ImageGroup): boolean => {
  if (!imageData?.selectedId || !imageData?.availableVersions) return false;
  return imageData.availableVersions.find((v) => v.id === imageData.selectedId)?.status === IMAGE_STATUS.BUILT;
};

export function validateImageChanged(originalImage: Image, updatedImage: Image) {
  const { updatedAt: __originalUpdatedAt, buildStatus: __originalBuiltStatus, ...original } = originalImage;
  const { updatedAt: __updatedUpdatedAt, buildStatus: __updatedBuiltStatus, ...updated } = updatedImage;
  return !isEqualSkippingUndefined(original, updated);
}

export const getVersionsList = (versions: ImageVersion[]): SelectOption[] => {
  return versions.map(({ id, version, status }) => {
    return {
      value: id,
      label: version,
      icon: <StatusIcon status={status} />,
    };
  });
};

export function getUniqueLatestImages(images: Image[]): Image[] {
  const map = new Map<string, Image>();

  for (const img of images) {
    const key = `${img.name}|${img.$type}`;
    const existing = map.get(key);
    if (!existing || existing.version < img.version) {
      map.set(key, img);
    }
  }

  return Array.from(map.values());
}

export function getUniqueImagesNames(images: Image[], type: IMAGE_TYPE): string[] {
  return [...new Set(images.filter((img) => img.$type === type).map((img) => img.name || ''))];
}

export const updateSelectedVersion = (images: ImageGroup[], id: string) => {
  return images.map((image) => {
    if (image?.availableVersions) {
      const selected = image?.availableVersions.find((i) => i.id === id);
      if (selected) {
        image.selectedId = id;
      }
    }
    return image;
  });
};

export const setTransport = (image: Image) => {
  const updatedImage = { ...image };
  if (
    updatedImage.$type === IMAGE_TYPE.INTERCEPTOR ||
    updatedImage.$type === IMAGE_TYPE.ADAPTER ||
    updatedImage.$type === IMAGE_TYPE.APPLICATION
  ) {
    delete updatedImage.transportType;
  } else {
    updatedImage.transportType = IMAGE_TRANSPORT_TYPE.LOCAL;
  }

  return updatedImage;
};

export const getImageSource = (isRegistry?: boolean): ImageSource => {
  if (isRegistry) {
    return {
      $type: IMAGE_SOURCE_TYPE.CODE,
      url: '',
      externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: '' },
    };
  }

  return {
    $type: IMAGE_SOURCE_TYPE.DOCKER,
    imageUri: '',
  };
};

export const getImageTemplate = (isRegistry?: boolean): Image => ({
  id: '',
  $type: IMAGE_TYPE.MCP,
  version: '1.0.0',
  name: '',
  description: '',
  source: getImageSource(isRegistry),
  transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
  imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS,
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
});
