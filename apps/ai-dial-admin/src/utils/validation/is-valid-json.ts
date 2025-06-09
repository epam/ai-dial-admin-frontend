export const isJSON = (str?: string) => {
  if (typeof str !== 'string') {
    return false;
  }
  try {
    const parsed = JSON.parse(str);
    return parsed !== null && (typeof parsed === 'object' || Array.isArray(parsed));
  } catch (e) {
    if (e) return false;
  }
};
