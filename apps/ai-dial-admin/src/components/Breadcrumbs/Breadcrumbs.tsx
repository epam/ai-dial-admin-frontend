'use client';

import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import classNames from 'classnames';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/src/locales/client';
import {
  enrichDetailsWithFolderBreadcrumbs,
  enrichWithFolderBreadcrumbs,
  getBreadcrumbs,
  getEntityFolderPath,
  getFolderContext,
  shouldEnrichDetailsWithFolderBreadcrumbs,
  shouldEnrichWithFolderBreadcrumbs,
} from '@/src/components/Breadcrumbs/utils';
import { Breadcrumb } from '@/src/components/Breadcrumbs/models';
import { Breadcrumbs as KitBreadcrumbs, BreadcrumbsItem, BreadcrumbsSize } from '@epam/ai-dial-ui-kit';

interface Props {
  mobile: boolean;
}

const Breadcrumbs: FC<Props> = ({ mobile }) => {
  const pathname = usePathname();
  const router = useRouter();
  const entityPath = useSearchParams()?.get('path');
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const folderContext = pathname ? getFolderContext?.(pathname, currentLocale)?.() : undefined;

  const basicBreadcrumbs = useMemo(() => {
    if (!pathname) {
      return [];
    }
    return getBreadcrumbs(pathname, currentLocale);
  }, [pathname, currentLocale]);

  const [enrichedBreadcrumbs, setEnrichedBreadcrumbs] = useState<Breadcrumb[] | null>(null);

  const setFilePath = folderContext?.setFilePath;
  const fetchFiles = folderContext?.fetchFiles;
  const fetchFolderHierarchy = folderContext?.fetchFolderHierarchy;
  const listHref = basicBreadcrumbs[0]?.href;

  // A folder crumb on a details page selects that folder and goes back to the list. The tree may not hold
  // the folder's ancestors (e.g. a direct load of the details page), so the whole chain is loaded and
  // expanded; a single fetch would only place a folder directly under an already loaded parent.
  const onOpenFolder = useCallback(
    (folderPath: string) => {
      setFilePath?.(folderPath);
      if (fetchFolderHierarchy) {
        fetchFolderHierarchy(folderPath, true);
      } else {
        fetchFiles?.(folderPath);
      }
      if (listHref) {
        router.push(listHref);
      }
    },
    [setFilePath, fetchFiles, fetchFolderHierarchy, listHref, router],
  );

  useEffect(() => {
    if (!pathname) {
      setEnrichedBreadcrumbs(null);
      return;
    }
    if (shouldEnrichWithFolderBreadcrumbs(pathname, currentLocale) && folderContext?.filePath) {
      setEnrichedBreadcrumbs(enrichWithFolderBreadcrumbs(basicBreadcrumbs, folderContext.filePath, setFilePath));
    } else if (shouldEnrichDetailsWithFolderBreadcrumbs(pathname, currentLocale) && setFilePath) {
      const folderPath = getEntityFolderPath(entityPath);
      setEnrichedBreadcrumbs(
        folderPath ? enrichDetailsWithFolderBreadcrumbs(basicBreadcrumbs, folderPath, onOpenFolder) : null,
      );
    } else {
      setEnrichedBreadcrumbs(null);
    }
  }, [pathname, currentLocale, basicBreadcrumbs, folderContext?.filePath, setFilePath, entityPath, onOpenFolder]);

  const breadcrumbs = enrichedBreadcrumbs ?? basicBreadcrumbs;

  const items = useMemo(
    () =>
      breadcrumbs.map(({ href, key, name, callback }): BreadcrumbsItem => {
        const label = key ? t(key) : name;

        if (callback) {
          return { label, onClick: () => callback(href) };
        }
        if (!href) {
          return { label };
        }
        return {
          label,
          href,
          onClick: (event) => {
            event.preventDefault();
            router.push(href);
          },
        };
      }),
    [breadcrumbs, router, t],
  );

  if (!pathname) {
    return null;
  }

  return (
    <div
      className={classNames(
        'w-full min-w-0 flex-row items-center pr-4',
        mobile ? 'lg:hidden flex shrink-0 pl-10 md:px-0 pb-2 mb-2' : 'lg:flex hidden',
      )}
    >
      <KitBreadcrumbs items={items} size={BreadcrumbsSize.Tiny} />
    </div>
  );
};

export default Breadcrumbs;
