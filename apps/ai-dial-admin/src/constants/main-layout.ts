export const CENTRAL_WINDOW_MIN_WIDTH = 800;

export const MAIN_MENU_ID = 'main-menu';

// local storage keys
export const LOCAL_STORAGE_CENTRAL_WINDOW_KEY = 'central-window-width';
export const LOCAL_STORAGE_SIDEBAR_OPEN_KEY = 'sidebar-open';

// icons
export const BASE_BUTTON_ICON_SIZE = 20;
export const BASE_BUTTON_ICON_PROPS = { size: BASE_BUTTON_ICON_SIZE, stroke: 2 };
export const MENU_ACTION_ICON_PROPS = { size: 16, stroke: 1.5 };

// controls
export const CONTROL_WIDTH = 'large_tablet:w-[640px] desktop:w-[640px] large_desktop:w-[40%] max-w-full';
export const STANDARD_CONTROL_WIDTH = `w-full ${CONTROL_WIDTH}`;
export const CONTROL_WITH_BUTTON_WIDTH = `flex-1 ${CONTROL_WIDTH}`;

/**
 * Header "View: Table | JSON". The label barely changes, so the box is a fixed width. It has to be
 * the wrapper: the 2.0 Select root is `w-full`, and a width on the Select itself loses to that.
 */
export const VIEW_SELECT_WIDTH_CLASS = 'w-[124px] shrink-0';

/**
 * A metric Select, whose label changes length. App utilities are all `!important`, so a sibling
 * `w-fit` does not beat the Select's `w-full` — the `&.w-full` selector does, by specificity.
 */
export const CONTENT_WIDTH_SELECT_CLASS =
  '[&.w-full]:w-fit max-w-full shrink-0 [&_.dial-kit-dropdown]:w-fit [&_.dial-kit-input]:w-fit [&_input]:w-auto [&_input]:field-sizing-content';

export const SELECT_ENTITY_HEADER_CLASS = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';
export const SELECT_ENTITY_MOBILE_HEADER_CLASS = 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6';
export const SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS = 'w-1/2 flex justify-center';
