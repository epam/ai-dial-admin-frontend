'use client';

import classNames from 'classnames';
import Link from 'next/link';
import { FC } from 'react';

import { MenuGroupConfiguration } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const iconColors: Record<string, string> = {
  [MenuI18nKey.Entities]: 'text-icon-accent-primary',
  [MenuI18nKey.Builders]: 'text-icon-accent-secondary',
  [MenuI18nKey.Assets]: 'text-icon-accent-tertiary',
  [MenuI18nKey.MLOps]: 'text-icon-accent-primary',
  [MenuI18nKey.AccessManagement]: 'text-icon-accent-secondary',
  [MenuI18nKey.Approvals]: 'text-icon-accent-tertiary',
  [MenuI18nKey.Telemetry]: 'text-icon-accent-primary',
};

const MenuGroup: FC<{ menuGroup: MenuGroupConfiguration }> = ({ menuGroup }) => {
  const t = useI18n();
  const iconClasses = classNames(
    'h-[64px] w-[64px] bg-layer-2 rounded-full flex items-center justify-center',
    iconColors[menuGroup.key],
  );

  return (
    <div className="p-4 flex flex-col bg-layer-3 flex-1 rounded h-[324px] md:min-w-[400px] lg:min-w-[520px] w-full">
      <div className="mb-3 flex flex-row gap-x-3 items-center">
        <div className={iconClasses}>{menuGroup.icon}</div>
        <h2>{t(menuGroup.key)}</h2>
      </div>
      <p className="small mb-3">{t(menuGroup.descriptionKey)}</p>
      <ul className="flex flex-col gap-x-2">
        {menuGroup.items.map((item) => (
          <li
            key={item.key}
            className="small font-semibold hover:bg-accent-primary-alpha py-2 px-3 cursor-pointer rounded"
          >
            <Link href={item.href} aria-label={t(item.key)}>
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default MenuGroup;
