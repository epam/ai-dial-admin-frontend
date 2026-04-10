'use client';

import { FC, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

import AdaptiveValueRow from './AdaptiveValueRow';

interface Props {
  title: string;
  entries: Array<[string, string | string[]]>;
}

const AdaptiveValueGrid: FC<Props> = ({ title, entries }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const onToggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <button className="flex items-center gap-2 dial-small-semi text-left" onClick={onToggle}>
        {isCollapsed ? (
          <IconChevronRight className="text-secondary shrink-0" {...BASE_BUTTON_ICON_PROPS} />
        ) : (
          <IconChevronDown className="text-secondary shrink-0" {...BASE_BUTTON_ICON_PROPS} />
        )}
        {title}
      </button>
      {!isCollapsed && (
        <div className="flex flex-col gap-3">
          {entries.map(([key, value]) => (
            <AdaptiveValueRow key={key} label={key} value={value} />
          ))}
        </div>
      )}
    </section>
  );
};

export default AdaptiveValueGrid;
