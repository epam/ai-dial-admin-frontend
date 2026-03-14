'use client';

import { FC, useState, useEffect } from 'react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/src/locales/client';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { getBreadcrumbs } from '@/src/components/Breadcrumbs/utils';
import { Breadcrumb } from '@/src/components/Breadcrumbs/models';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  mobile: boolean;
}

const Breadcrumbs: FC<Props> = ({ mobile }) => {
  const pathname = usePathname();
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  if (!pathname) return null;

  useEffect(() => {
    setBreadcrumbs(getBreadcrumbs(pathname, currentLocale));
  }, [pathname, currentLocale]);

  return (
    <div
      className={classNames(
        'flex-row items-center pr-4 pl-10',
        mobile ? 'lg:hidden flex md:px-0 pb-2 mb-2 overflow-x-auto cursor-move' : 'lg:flex hidden',
      )}
    >
      <ol className="flex tiny whitespace-nowrap">
        {breadcrumbs.map(({ href, key, name }, index) => {
          const label = key ? t(key) : name;
          const linkClassName = classNames(
            'flex text-secondary relative group-[:last-child]:text-primary',
            'group-[:last-child]:pointer-events-none group-[:not(:last-child)]:hover:text-accent-primary group-[:not(:last-child)]:focus-within:text-accent-primary',
            !href.length && 'pointer-events-none',
          );

          return (
            <li key={`${href}_${index}`} className="flex items-center group max-w-[300px] truncate">
              <Link prefetch={false} href={href} className={linkClassName}>
                <DialEllipsisTooltip text={decodeURIComponent(label)} />
              </Link>
              {breadcrumbs.length !== index + 1 && (
                <IconChevronRight width={16} height={16} className="text-secondary" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Breadcrumbs;
