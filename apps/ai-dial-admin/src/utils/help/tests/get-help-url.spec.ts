import { describe, expect, test } from 'vitest';

import { HELP_DOCUMENTATION_LINKS } from '@/src/constants/help-documentation-links';
import { ApplicationRoute } from '@/src/types/routes';
import { getHelpUrl, isListView } from '../get-help-url';

describe('Utils :: getHelpUrl', () => {
  test('Should return help link for a valid base route', () => {
    expect(getHelpUrl('/models')).toEqual(HELP_DOCUMENTATION_LINKS[ApplicationRoute.Models]);
  });

  test('Should return help link for a locale-prefixed route', () => {
    expect(getHelpUrl('/en/models')).toEqual(HELP_DOCUMENTATION_LINKS[ApplicationRoute.Models]);
  });

  test('Should return help link for route with additional segments', () => {
    expect(getHelpUrl('/en/models/123')).toEqual(HELP_DOCUMENTATION_LINKS[ApplicationRoute.Models]);
  });

  test('Should return undefined for empty or root pathname', () => {
    expect(getHelpUrl('')).toBeUndefined();
    expect(getHelpUrl('/')).toBeUndefined();
  });

  test('Should return undefined for unknown route', () => {
    expect(getHelpUrl('/unknown')).toBeUndefined();
  });

  test('Should return undefined when pathname contains only locale', () => {
    expect(getHelpUrl('/en')).toBeUndefined();
  });
});

describe('Utils :: isListView', () => {
  test('Should return true for locale-prefixed list view', () => {
    expect(isListView('/en/models')).toBe(true);
  });

  test('Should return true for non-locale list view', () => {
    expect(isListView('/models')).toBe(true);
  });

  test('Should return false for locale-prefixed selected view', () => {
    expect(isListView('/en/models/kk-test')).toBe(false);
  });

  test('Should return false for non-locale selected view', () => {
    expect(isListView('/models/kk-test')).toBe(false);
  });

  test('Should return false for unknown route and root', () => {
    expect(isListView('/unknown')).toBe(false);
    expect(isListView('/')).toBe(false);
  });
});
