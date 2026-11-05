import { FC } from 'react';

import { MENU_ICON_GRADIENT_ID } from '@/src/constants/main-layout';

const MenuIconGradient: FC = () => (
  <svg width={0} height={0} className="absolute" aria-hidden>
    <defs>
      <linearGradient id={MENU_ICON_GRADIENT_ID} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" style={{ stopColor: 'var(--border-color-gradient-1)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--border-color-gradient-2)' }} />
      </linearGradient>
    </defs>
  </svg>
);

export default MenuIconGradient;
