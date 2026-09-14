'use client';

import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/src/locales/client';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import {
  enrichWithFolderBreadcrumbs,
  getBreadcrumbs,
  getFolderContext,
  shouldEnrichWithFolderBreadcrumbs,
} from '@/src/components/Breadcrumbs/utils';
import { Breadcrumb } from '@/src/components/Breadcrumbs/models';
import { DialDropdown, DialEllipsisTooltip, DropdownItem } from '@epam/ai-dial-ui-kit';

interface Props {
  mobile: boolean;
}

const Breadcrumbs: FC<Props> = ({ mobile }) => {
  const pathname = usePathname();
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

  useEffect(() => {
    if (!pathname) {
      setEnrichedBreadcrumbs(null);
      return;
    }
    if (shouldEnrichWithFolderBreadcrumbs(pathname, currentLocale) && folderContext?.filePath) {
      setEnrichedBreadcrumbs(
        enrichWithFolderBreadcrumbs(basicBreadcrumbs, folderContext.filePath, folderContext.setFilePath),
      );
    } else {
      setEnrichedBreadcrumbs(null);
    }
  }, [pathname, currentLocale, basicBreadcrumbs, folderContext?.filePath, folderContext?.setFilePath]);

  const breadcrumbs = enrichedBreadcrumbs ?? basicBreadcrumbs;

  const getHiddenBreadcrumbsDropdown = useCallback(
    (name: string, hiddenBreadcrumbs: Breadcrumb[]) => (
      <DialDropdown
        className="cursor-pointer text-secondary hover:text-accent-primary"
        placement="bottom-start"
        items={hiddenBreadcrumbs.map(
          (b): DropdownItem => ({
            key: b.href,
            label: <span className="dial-small-text">{b.name}</span>,
            onClick: () => (b.callback ? b.callback(b.href) : void 0),
          }),
        )}
      >
        {name}
      </DialDropdown>
    ),
    [],
  );

  const getBreadcrumbItem = useCallback(
    (breadcrumb: Breadcrumb) => {
      const { href, key, name, callback, hiddenBreadcrumbs } = breadcrumb;
      const label = key ? t(key) : name;
      const linkClassName = classNames(
        'flex-1 min-w-0 text-secondary relative group-[:last-child]:text-primary',
        'group-[:last-child]:cursor-default group-[:not(:last-child)]:hover:text-accent-primary group-[:not(:last-child)]:focus-within:text-accent-primary',
        !href.length && 'pointer-events-none',
      );

      if (callback) {
        return (
          <Link
            prefetch={false}
            onClick={(e) => {
              e.preventDefault();
              callback(href);
            }}
            href="/"
            className={linkClassName}
          >
            <DialEllipsisTooltip text={label} />
          </Link>
        );
      } else if (hiddenBreadcrumbs && hiddenBreadcrumbs.length > 0) {
        return getHiddenBreadcrumbsDropdown(name, hiddenBreadcrumbs);
      } else {
        return (
          <Link prefetch={false} href={href} className={linkClassName}>
            <DialEllipsisTooltip text={label} />
          </Link>
        );
      }
    },
    [getHiddenBreadcrumbsDropdown, t],
  );

  if (!pathname) {
    return null;
  }

  return (
    <div
      className={classNames(
        'flex-row items-center pr-4 pl-10',
        mobile ? 'lg:hidden flex md:px-0 pb-2 mb-2 overflow-x-auto cursor-move' : 'lg:flex hidden',
      )}
    >
      <ol className="flex tiny whitespace-nowrap">
        {breadcrumbs.map((breadcrumb, index) => {
          return (
            <li key={`${breadcrumb.href}_${index}`} className="flex items-center group max-w-[300px] overflow-hidden">
              {getBreadcrumbItem(breadcrumb)}
              {breadcrumbs.length !== index + 1 && (
                <IconChevronRight width={12} height={12} className="text-secondary m-1" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Breadcrumbs;
