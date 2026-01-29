import { SelectOption } from '@epam/ai-dial-ui-kit';
import { STATUS_CLASSNAMES } from '@/src/constants/deployments/images';
import { IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { Image, ImageGroup, ImageVersion } from '@/src/models/deployments/images';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

import StatusIcon from '@/src/components/Deployments/Common/StatusIndicator/StatusIcon';

export function getActionClass(action: IMAGE_STATUS | CONTAINER_STATUS): string {
  return STATUS_CLASSNAMES[action];
}

export function getImageType(route: ApplicationRoute): string {
  switch (route) {
    case ApplicationRoute.InterceptorDeployments:
      return 'INTERCEPTOR';
    case ApplicationRoute.McpDeployments:
      return 'MCP';
    case ApplicationRoute.ModelServings:
      return 'NIM';
    default:
      return '';
  }
}

export const isValidVersion = (imageData: ImageGroup): boolean => {
  return (
    !!imageData.selectedId &&
    imageData.availableVersions.find((v) => v.id === imageData.selectedId)?.status === IMAGE_STATUS.BUILT
  );
};

export function validateImageChanged(originalImage: Image, updatedImage: Image) {
  const { updatedAt: __originalUpdatedAt, buildStatus: __originalBuiltStatus, ...original } = originalImage;
  const { updatedAt: __updatedUpdatedAt, buildStatus: __updatedBuiltStatus, ...updated } = updatedImage;
  return !isEqualSkippingUndefined(original, updated);
}

export function validateImage(image: Image): boolean {
  if (!image.name?.trim()) {
    return false;
  }

  if (!image.version.trim()) {
    return false;
  }

  if (!image.transportType && image.$type === IMAGE_TYPE.MCP) {
    return false;
  }

  if (!image.source?.$type) {
    return false;
  }

  return true;
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
  if (updatedImage.$type === IMAGE_TYPE.INTERCEPTOR) {
    delete updatedImage.transportType;
  } else {
    updatedImage.transportType = IMAGE_TRANSPORT_TYPE.LOCAL;
  }

  return updatedImage;
};
