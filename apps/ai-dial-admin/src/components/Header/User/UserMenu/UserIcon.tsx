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

const getFirstLetter = (word: string): string => word.match(/\p{L}/u)?.[0]?.toUpperCase() ?? '';

const getShortName = (name?: string | null): string | null | undefined => {
  if (!name) {
    return name;
  }

  const letters = name.split(' ').map(getFirstLetter).filter(Boolean);

  return letters.slice(0, 2).join('') || name;
};

interface FallbackIconProps {
  name?: string | null;
  seed?: string | null;
  className?: string;
}

export const FallbackIcon = ({ name, seed, className }: FallbackIconProps) => {
  const bg = randomColor({
    luminosity: 'bright',
    seed: seed || name || '',
  });

  const textColor = readableColor(bg);

  const shortName = useMemo(() => getShortName(name), [name]);

  return (
    <div
      className={classNames(
        'flex size-[28px] shrink-0 items-center justify-center rounded-full text-[12px]/[16px] font-normal',
        className,
      )}
      style={{ backgroundColor: bg, color: textColor }}
    >
      {shortName}
    </div>
  );
};

export const UserIcon = ({ className, userName }: Props) => {
  const { data: session } = useSession();
  const [showFallbackIcon, setShowFallbackIcon] = useState(!session?.user?.image);

  useEffect(() => {
    if (session?.user?.image) {
      setShowFallbackIcon(false);
    }
  }, [session?.user?.image]);

  return (
    <DialTooltip tooltip={userName}>
      {showFallbackIcon ? (
        <FallbackIcon name={session?.user?.name} seed={session?.user?.email} />
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
