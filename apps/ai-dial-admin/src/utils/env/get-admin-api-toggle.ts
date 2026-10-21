/** Whether the admin backend is configured. The one reading of the flag, for the layout and the server alike. */
export const getIsAdminApiEnabled = (): boolean => process.env.DIAL_ADMIN_API_URL != null;
