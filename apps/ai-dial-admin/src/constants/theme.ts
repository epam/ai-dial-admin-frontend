export const DEFAULT_THEME = 'light';

// Themes change rarely, so the server Data Cache and the browser each keep the theme for this window.
// Both revalidate in the background after it: new colors appear within one window plus one page load,
// a changed image within about two windows (server, then browser) plus one page load.
export const THEME_REVALIDATE_SECONDS = 1800;
// Upper bound for one request to the themes host: layouts await it, so a host that accepts the connection
// and never answers would otherwise keep every page loading.
export const THEME_FETCH_TIMEOUT_MS = 3000;
// How long a browser may still show an expired theme image while it checks for a newer one.
export const THEME_IMAGE_STALE_SECONDS = 24 * 60 * 60;
