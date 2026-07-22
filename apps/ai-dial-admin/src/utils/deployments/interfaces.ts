export function stripEmptyInterfaces<T extends Record<string, { baseUrl?: string; base_url?: string }>>(
  interfaces: T | undefined,
): T | undefined {
  if (!interfaces) {
    return interfaces;
  }

  const filtered = Object.fromEntries(
    Object.entries(interfaces).filter(([, value]) => Boolean(value.baseUrl || value.base_url)),
  ) as T;

  return Object.keys(filtered).length ? filtered : undefined;
}
