/*eslint-disable @next/next/no-img-element*/
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { readableColor } from 'polished';
import randomColor from 'randomcolor';

interface Props {
  userName?: string;
  iconSize?: number;
  className?: string;
}

export const UserIcon = ({ className, userName }: Props) => {
  const { data: session } = useSession();
  const [showFallbackIcon, setShowFallbackIcon] = useState(!session?.user?.image);

  const bg = randomColor({
    luminosity: 'bright',
    seed: session?.user?.email || '',
  });

  const textColor = readableColor(bg);

  const shortName = useMemo(() => {
    const [part1, part2] = session?.user?.name?.split(' ') ?? [];
    if (part1 && part2) {
      return `${part1[0]}${part2[0]}`;
    }

    return session?.user?.name;
  }, [session?.user?.name]);

  useEffect(() => {
    if (session?.user?.image) {
      setShowFallbackIcon(false);
    }
  }, [session?.user?.image]);

  return (
    <DialTooltip tooltip={userName}>
      {showFallbackIcon ? (
        <div
          className="flex size-[28px] items-center justify-center rounded-full text-[12px]/[16px] font-normal"
          style={{ backgroundColor: bg, color: textColor }}
        >
          {shortName}
        </div>
      ) : (
        <img
          className={classNames('rounded-full', className)}
          src={session?.user?.image ?? ''}
          width={28}
          height={28}
          alt="User avatar"
          onError={() => setShowFallbackIcon(true)}
        />
      )}
    </DialTooltip>
  );
};
