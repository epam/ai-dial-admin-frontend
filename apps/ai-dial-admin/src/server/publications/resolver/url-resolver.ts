import { PublicationStatus } from '@/src/models/dial/publications';
import { CorePublicationResource, CoreResourceAction } from '@/src/server/publications/models';

/**
 * Resolves the effective URL of a publication resource by its action and the
 * publication status — a port of the backend `PublicationResourceUrlResolver`:
 *
 *  - ADD / ADD_IF_ABSENT → reviewUrl (PENDING), targetUrl (APPROVED), sourceUrl (REJECTED)
 *  - DELETE              → targetUrl (always)
 */
export const resolveResourceUrl = (resource: CorePublicationResource, status: PublicationStatus): string => {
  if (resource.action === CoreResourceAction.DELETE) {
    return resource.targetUrl ?? '';
  }

  switch (status) {
    case PublicationStatus.APPROVED:
      return resource.targetUrl ?? '';
    case PublicationStatus.REJECTED:
      return resource.sourceUrl ?? '';
    case PublicationStatus.PENDING:
    default:
      return resource.reviewUrl ?? '';
  }
};
