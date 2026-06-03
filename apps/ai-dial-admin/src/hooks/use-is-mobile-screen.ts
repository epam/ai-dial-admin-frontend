import { isSmallScreen } from '@/src/utils/mobile';
import { useEffect, useState } from 'react';

export const useIsMobileScreen = () => {
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    setIsMobileScreen(isSmallScreen());
    const resizeListener = () => setIsMobileScreen(isSmallScreen());

    window.addEventListener('resize', resizeListener);
    return () => window.removeEventListener('resize', resizeListener);
  }, []);

  return isMobileScreen;
};
