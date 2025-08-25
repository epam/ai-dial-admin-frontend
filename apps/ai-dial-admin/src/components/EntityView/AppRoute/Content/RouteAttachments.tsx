'use client';
import { FC, useCallback } from 'react';

import Paths from '@/src/components/Routes/Paths/Paths';
import { RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute } from '@/src/models/dial/route';

interface Props {
  route: DialAppRoute;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteAttachments: FC<Props> = ({ route, onChangeRoute }) => {
  const t = useI18n() as (str: string) => string;

  const onChangeRequest = useCallback(
    (paths: string[]) => {
      onChangeRoute({ ...route, attachmentPaths: { ...route.attachmentPaths, requestBody: paths } });
    },
    [route, onChangeRoute],
  );

  const onChangeResponse = useCallback(
    (paths: string[]) => {
      onChangeRoute({ ...route, attachmentPaths: { ...route.attachmentPaths, responseBody: paths } });
    },
    [route, onChangeRoute],
  );

  return (
    <div className="h-full w-full flex flex-col divide-y gap-y-9 divide-primary">
      <div className="w-full lg:w-[50%]">
        <Paths
          title={t(RoutesI18nKey.RequestAttachmentPaths)}
          paths={route.attachmentPaths.requestBody}
          onChangePaths={onChangeRequest}
        />
      </div>
      <div className="w-full lg:w-[50%] mt-10">
        <Paths
          title={t(RoutesI18nKey.ResponseAttachmentPaths)}
          paths={route.attachmentPaths.responseBody}
          onChangePaths={onChangeResponse}
        />
      </div>
    </div>
  );
};

export default RouteAttachments;
