import classNames from 'classnames';
import Image from 'next/image';
import { FC } from 'react';

import Empty from '@/public/images/icons/empty.svg';
import { useTheme } from '@/src/context/ThemeContext';
import { getIconPath } from '@/src/utils/themes/icon-path';

interface Props {
  selectedIcon: string | null;
  setSelectedIcon: (url: string) => void;
}

export interface Icon {
  url: string;
  name: string;
}

interface IconProps extends Icon {
  onClick: () => void;
  selected: boolean;
}

const Icon: FC<IconProps> = ({ url, name, selected, onClick }) => {
  const iconClassName = classNames(
    'flex w-[120px] flex-col items-center justify-center border cursor-pointer px-5 py-3 hover:bg-accent-primary-alpha',
    selected ? 'border-accent-primary bg-accent-primary-alpha' : 'border-transparent',
  );
  const iconBackgroundClassName = classNames('mb-2 text-icon-primary', url && 'rounded-full bg-model-icon');
  const iconTitleClassName = classNames('tiny truncate w-full', selected ? 'text-primary' : 'text-secondary');

  return (
    <button className={iconClassName} onClick={onClick} aria-label="Icon">
      <div className={iconBackgroundClassName}>
        {!url ? (
          <i className={selected ? 'text-icon-primary' : 'text-icon-secondary'}>
            <Empty />
          </i>
        ) : (
          <Image src={url} alt={name} width={80} height={80} />
        )}
      </div>
      <p className={iconTitleClassName}>{name}</p>
    </button>
  );
};

const IconGallery: FC<Props> = ({ selectedIcon, setSelectedIcon }) => {
  const { images } = useTheme();

  return (
    <>
      <div className="flex flex-row flex-wrap gap-10 pb-8 border-b border-primary mb-8">
        <Icon url={''} name={'None'} onClick={() => setSelectedIcon('')} selected={!selectedIcon} />
      </div>
      <div className="flex flex-row flex-wrap gap-10">
        {images?.map((icon, index) => (
          <Icon
            key={index}
            url={getIconPath(icon.url)}
            name={icon.name}
            onClick={() => setSelectedIcon(icon.url)}
            selected={icon.url === selectedIcon}
          />
        ))}
      </div>
    </>
  );
};

export default IconGallery;
