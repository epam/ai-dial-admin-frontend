import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { buildArrayOperationsRows, buildConditionalsRows, buildMathStringRows, buildPathNavigationRows } from './utils';
import { DocumentationGridSection } from './types';

export const GRID_SECTIONS: DocumentationGridSection[] = [
  { titleKey: JsonAtaI18nKey.PathNavigation, buildRows: buildPathNavigationRows },
  { titleKey: JsonAtaI18nKey.ArrayOperations, buildRows: buildArrayOperationsRows },
  { titleKey: JsonAtaI18nKey.ConditionalsNullSafety, buildRows: buildConditionalsRows },
  { titleKey: JsonAtaI18nKey.MathStringFunctions, buildRows: buildMathStringRows },
];

export const RESOURCE_LINKS = [
  { labelKey: JsonAtaI18nKey.SimpleQueries, url: 'https://docs.jsonata.org/simple' },
  { labelKey: JsonAtaI18nKey.Predicates, url: 'https://docs.jsonata.org/predicate' },
  { labelKey: JsonAtaI18nKey.StringFunctions, url: 'https://docs.jsonata.org/string-functions' },
  { labelKey: JsonAtaI18nKey.NumericFunctions, url: 'https://docs.jsonata.org/numeric-functions' },
  { labelKey: JsonAtaI18nKey.Playground, url: 'https://try.jsonata.org/' },
] as const;
