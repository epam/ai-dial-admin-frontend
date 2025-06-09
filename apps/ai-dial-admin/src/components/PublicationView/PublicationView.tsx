'use client';

import { useCallback } from 'react';
import { ApplicationRoute } from '@/src/types/routes';
import BasePublicationHeader from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationHeader';
import { ServerActionResponse } from '@/src/models/server-action';
import PublicationProperties from '@/src/components/PublicationView/PublicationProperties';
import { Publication } from '@/src/models/dial/publications';
import { useRouter } from 'next/navigation';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';

interface PublicationViewProps<T> {
  view: ApplicationRoute;
  publication: T;
  approvePublication: (path: string) => Promise<ServerActionResponse>;
  declinePublication: (path: string, comment: string) => Promise<ServerActionResponse>;
}

const PublicationView = <T extends Publication>({
  view,
  publication,
  approvePublication,
  declinePublication,
}: PublicationViewProps<T>) => {
  const router = useRouter();
  const { showNotification } = useNotification();

  const onApprove = useCallback(() => {
    approvePublication(publication.path).then((res) => {
      if (res.success) {
        router.push(view);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [approvePublication, publication.path, router, showNotification, view]);

  const onDecline = useCallback(
    (comment: string) => {
      declinePublication(publication.path, comment).then((res) => {
        if (res.success) {
          router.push(view);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [declinePublication, publication.path, router, showNotification, view],
  );

  return (
    <div
      data-testid="publication-view"
      className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative"
    >
      <div className="flex flex-row justify-between min-h-[34px]">
        <div className="flex flex-row mb-3" data-testid="publication-view-header">
          <h1>{publication.requestName}</h1>
        </div>
        <BasePublicationHeader onApprove={onApprove} onDecline={onDecline} action={publication.action} route={view} />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        <PublicationProperties view={view} publication={publication} />
      </div>
    </div>
  );
};

export default PublicationView;
