'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import BasePublicationHeader from '@/src/components/Publications/Properties/Header';
import PublicationProperties from '@/src/components/Publications/View/Properties';
import { useNotification } from '@/src/context/NotificationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { Publication } from '@/src/models/dial/publications';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';

interface Props<T> {
  view: ApplicationRoute;
  publication: T;
  applicationSchemes?: DialApplicationScheme[] | null;
  approvePublication: (path: string) => Promise<ServerActionResponse>;
  declinePublication: (path: string, comment: string) => Promise<ServerActionResponse>;
}

const PublicationView = <T extends Publication>({
  view,
  publication,
  approvePublication,
  applicationSchemes,
  declinePublication,
}: Props<T>) => {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isJsonView, setIsJsonView] = useState<boolean>(false);

  const onApprove = useCallback(() => {
    approvePublication(publication.path).then((res) => {
      if (res.success) {
        router.push(view);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [approvePublication, publication.path, router, showNotification, view]);

  const onDecline = useCallback(
    (comment: string) => {
      declinePublication(publication.path, comment).then((res) => {
        if (res.success) {
          router.push(view);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [declinePublication, publication.path, router, showNotification, view],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className="flex flex-row justify-between min-h-[34px]">
        <div className="flex flex-row mb-3">
          <h1>{publication.requestName}</h1>
        </div>
        <BasePublicationHeader
          onApprove={onApprove}
          onDecline={onDecline}
          action={publication.action}
          route={view}
          isJsonView={isJsonView}
          setIsJsonView={setIsJsonView}
          isDelete={!!publication.missingResources?.length}
        />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonView ? (
          <EntityJsonEditor entity={publication} readonly={true} />
        ) : (
          <PublicationProperties view={view} publication={publication} applicationSchemes={applicationSchemes} />
        )}
      </div>
    </div>
  );
};

export default PublicationView;
