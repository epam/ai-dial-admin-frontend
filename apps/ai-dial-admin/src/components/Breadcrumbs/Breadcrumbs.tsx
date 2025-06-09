'use client';
/* eslint-disable react-hooks/rules-of-hooks */
import { FC, useState, useEffect } from 'react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/src/locales/client';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { Breadcrumb, getBreadcrumbs } from '@/src/components/Breadcrumbs/Breadcrumbs.utils';
import { useAppContext } from '@/src/context/AppContext';
interface Props {
  mobile: boolean;
}

const Breadcrumbs: FC<Props> = ({ mobile }) => {
  const pathname = usePathname();
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const { embeddedApps } = useAppContext();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  if (!pathname) return null;

  const defaultLinkClassNames = classNames(
    'flex text-secondary relative group-[:last-child]:text-primary group-[:last-child]:pointer-events-none',
    'group-[:not(:last-child)]:hover:text-accent-primary group-[:not(:last-child)]:focus-within:text-accent-primary',
  );

  const containerClassNames = classNames(
    'flex-row items-center px-4 ',
    mobile ? 'lg:hidden flex md:px-0 pb-2 mb-2 overflow-x-auto cursor-move' : 'lg:flex hidden',
  );

  useEffect(() => {
    setBreadcrumbs(getBreadcrumbs(pathname, currentLocale, embeddedApps));
  }, [pathname, currentLocale, embeddedApps]);

  return (
    <div className={containerClassNames}>
      <ol className="flex tiny whitespace-nowrap">
        {breadcrumbs.map(({ href, key, name }, index) => {
          const label = key ? t(key) : name;
          const linkClassNames = classNames(defaultLinkClassNames, `${!href.length ? 'pointer-events-none' : ''}`);

          return (
            <li key={`${href}_${index}`} className="flex items-center group">
              <Link href={href} className={linkClassNames}>
                {decodeURIComponent(label)}
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
