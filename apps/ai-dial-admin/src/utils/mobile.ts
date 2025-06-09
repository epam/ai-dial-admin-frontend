export const isSmallScreen = () => typeof window !== 'undefined' && window.innerWidth < 600;

export const isMediumScreen = () => typeof window !== 'undefined' && window.innerWidth < 1024;

export const isOnlyMediumScreen = () => isMediumScreen() && !isSmallScreen();
