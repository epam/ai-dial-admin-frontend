export const CENTRAL_WINDOW_MIN_WIDTH = 800;

// local storage keys
export const LOCAL_STORAGE_CENTRAL_WINDOW_KEY = 'central-window-width';
export const LOCAL_STORAGE_SIDEBAR_OPEN_KEY = 'sidebar-open';

// icons
export const BASE_BUTTON_ICON_SIZE = 20;
export const BASE_BUTTON_ICON_PROPS = { size: BASE_BUTTON_ICON_SIZE, stroke: 2 };

// controls
export const CONTROL_WIDTH = 'large_tablet:w-[640px] desktop:w-[640px] large_desktop:w-[40%] max-w-full';
export const STANDARD_CONTROL_WIDTH = `w-full ${CONTROL_WIDTH}`;
export const CONTROL_WITH_BUTTON_WIDTH = `flex-1 ${CONTROL_WIDTH}`;

export const SELECT_ENTITY_HEADER_CLASS = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';
export const SELECT_ENTITY_MOBILE_HEADER_CLASS = 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6';
export const SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS = 'w-1/2 flex justify-center';
