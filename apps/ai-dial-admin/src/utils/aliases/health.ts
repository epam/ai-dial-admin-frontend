import { ConfigHealthSkippedEntity } from '@/src/models/dial/config-health';

/**
 * The ids Core reports an alias under: `aliases/<name>` for one in the config (a config-file alias, or a platform
 * one merged into it), and its URL `aliases/public/<name>` for a stored public one. A platform alias skipped as a
 * duplicate name is reported under its canonical URL, so that spelling is matched too.
 */
export const getAliasHealthIds = (name: string, isPublic: boolean): string[] =>
  isPublic ? [`aliases/public/${name}`] : [`aliases/${name}`, `aliases/platform/${name}`];

/** The entry of Core's health report that concerns this alias, if any. */
export const findAliasHealthIssue = (
  skipped: readonly ConfigHealthSkippedEntity[] | undefined,
  name: string,
  isPublic: boolean,
): ConfigHealthSkippedEntity | undefined => {
  const ids = getAliasHealthIds(name, isPublic);

  return skipped?.find((entry) => ids.includes(entry.id));
};
