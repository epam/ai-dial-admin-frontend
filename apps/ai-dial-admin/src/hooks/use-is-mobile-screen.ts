import { isSmallScreen } from '@/src/utils/mobile';
import { useEffect, useState } from 'react';

export const useIsMobileScreen = () => {
  const [isMobileScreen, setIsMobileScreen] = useState(isSmallScreen());

  useEffect(() => {
    const resizeListener = () => setIsMobileScreen(isSmallScreen());

    window.addEventListener('resize', resizeListener);
    return () => window.removeEventListener('resize', resizeListener);
  }, []);

  return isMobileScreen;
};
