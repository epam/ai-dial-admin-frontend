import { ROUTES_PREFIX } from '@/src/constants/publications-core';

export const toCanonicalRouteName = (name: string): string =>
  name.startsWith(ROUTES_PREFIX) ? name : `${ROUTES_PREFIX}${name}`;

export const fromCanonicalRouteName = (name?: string): string =>
  name?.startsWith(ROUTES_PREFIX) ? name.slice(ROUTES_PREFIX.length) : (name ?? '');
