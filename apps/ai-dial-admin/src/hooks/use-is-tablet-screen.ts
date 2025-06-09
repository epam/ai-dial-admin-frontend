import { isMediumScreen, isOnlyMediumScreen } from '@/src/utils/mobile';
import { useEffect, useState } from 'react';

export const useIsTabletScreen = () => {
  const [isTabletScreen, setIsTabletScreen] = useState(isMediumScreen());

  useEffect(() => {
    const resizeListener = () => setIsTabletScreen(isMediumScreen());
    window.addEventListener('resize', resizeListener);
    return () => window.removeEventListener('resize', resizeListener);
  }, []);

  return isTabletScreen;
};

export const useIsOnlyTabletScreen = () => {
  const [isTabletScreen, setIsTabletScreen] = useState(isOnlyMediumScreen());

  useEffect(() => {
    const resizeListener = () => setIsTabletScreen(isOnlyMediumScreen());
    window.addEventListener('resize', resizeListener);
    return () => window.removeEventListener('resize', resizeListener);
  }, []);

  return isTabletScreen;
};
