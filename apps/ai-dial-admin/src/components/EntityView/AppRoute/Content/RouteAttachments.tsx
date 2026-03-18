'use client';
import { FC, useCallback } from 'react';

import Divider from '@/src/components/Common/Divider/Divider';
import Paths from '@/src/components/Routes/Paths/Paths';
import { RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AttachmentPaths, DialAppRoute } from '@/src/models/dial/route';

interface Props {
  route: DialAppRoute;
  disabled?: boolean;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteAttachments: FC<Props> = ({ route, disabled, onChangeRoute }) => {
  const t = useI18n();

  const onChangeRequest = useCallback(
    (paths: string[]) => {
      onChangeRoute({
        ...route,
        attachmentPaths: { ...(route.attachmentPaths || {}), requestBody: paths } as AttachmentPaths,
      });
    },
    [route, onChangeRoute],
  );

  const onChangeResponse = useCallback(
    (paths: string[]) => {
      onChangeRoute({
        ...route,
        attachmentPaths: { ...(route.attachmentPaths || {}), responseBody: paths } as AttachmentPaths,
      });
    },
    [route, onChangeRoute],
  );

  return (
    <div className="size-full flex flex-col gap-y-9 mt-3">
      <Paths
        label={t(RoutesI18nKey.RequestAttachmentPaths)}
        paths={
          route.attachmentPaths?.requestBody && route.attachmentPaths?.requestBody.length
            ? route.attachmentPaths?.requestBody
            : ['']
        }
        disabled={disabled}
        onChangePaths={onChangeRequest}
        disableValidation
      />
      <Divider />
      <Paths
        label={t(RoutesI18nKey.ResponseAttachmentPaths)}
        disabled={disabled}
        paths={
          route.attachmentPaths?.responseBody && route.attachmentPaths?.responseBody.length
            ? route.attachmentPaths?.responseBody
            : ['']
        }
        onChangePaths={onChangeResponse}
        disableValidation={true}
      />
    </div>
  );
};

export default RouteAttachments;
