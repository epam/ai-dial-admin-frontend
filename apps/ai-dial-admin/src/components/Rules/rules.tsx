import { IconEqual } from '@tabler/icons-react';

import Contains from '@/public/images/icons/filter/contains.svg';
import Regex from '@/public/images/icons/regex.svg';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { DialRule, RuleDiffStatus, RuleDiffModel, RuleFunction, RuleSource } from '@/src/models/dial/rule';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { JSX } from 'react';

const operations = [RuleFunction.EQUAL, RuleFunction.CONTAIN, RuleFunction.REGEX];

/**
 * Generate and translate dropdown items for attribute selector inside folder rule configuration
 *
 * @param {(t: string) => string} t - function for translate
 * @param {?string[]} [attributes] - list of available attributes
 * @returns {DropdownItemsModel[]} - list of translated dropdown items
 */
export const getAttributeItems = (t: (t: string) => string, attributes?: string[]): DropdownItemsModel[] => {
  return (
    attributes?.map((a) => {
      const name = t(FoldersI18nKey[RuleSource[a as keyof typeof RuleSource]]);
      return {
        id: a,
        name,
      };
    }) || []
  );
};

/**
 * Generate and translate dropdown items for operation selector inside folder rule configuration
 *
 * @param {(t: string) => string} t - function for translate
 * @returns {DropdownItemsModel[]} - list of translated dropdown items
 */
export const getOperationItems = (t: (t: string) => string): DropdownItemsModel[] => {
  return operations.map((a) => ({ id: a, name: t(FoldersI18nKey[a]), icon: getOperationIcon(a) }));
};

/**
 * Generate correct icon jsx component, based on provided rule operation
 *
 * @param {RuleFunction} operation - folder rule operations
 * @returns {(JSX.Element | undefined)} - icon component
 */
export const getOperationIcon = (operation: RuleFunction): JSX.Element | undefined => {
  if (operation === RuleFunction.EQUAL) {
    return <IconEqual {...BASE_ICON_PROPS} />;
  }
  if (operation === RuleFunction.CONTAIN) {
    return <Contains />;
  }
  if (operation === RuleFunction.REGEX) {
    return <Regex />;
  }
};

/**
 * Generate array of DialRule map, sorted from shorter path to longer
 *
 * @param {Record<string, DialRule[]>} rulesMap - DialRule map, where key is folder path, value is DialRule map with all paths include parent paths
 * @returns {[string, DialRule[]][]} -  array of DialRule map values
 */
export const sortRules = (rulesMap: Record<string, DialRule[]>): [string, DialRule[]][] => {
  return Object.entries(rulesMap).sort(([a], [b]) => {
    const depthA = a.split('/').filter(Boolean).length;
    const depthB = b.split('/').filter(Boolean).length;
    return depthA - depthB;
  });
};

/**
 * Checks rule and excluded or included rules, for correct comparison
 *
 * @param {DialRule} rule - DialRule which need to check
 * @param {?DialRule[]} [rulesToExclude] - array of proposed DialRules
 * @param {?DialRule[]} [rulesToInclude] - array of current DialRules
 * @returns {(RuleDiffModel | undefined)} - RuleDiffModel if some changes exists or undefined if rules are same
 */
export const generateRuleDiff = (
  rule: DialRule,
  rulesToExclude?: DialRule[],
  rulesToInclude?: DialRule[],
): RuleDiffModel | undefined => {
  const rules = rulesToExclude || rulesToInclude;
  const status = rulesToExclude ? RuleDiffStatus.EXCLUDE : rulesToInclude ? RuleDiffStatus.INCLUDE : undefined;
  if (!rules || !status) return;

  const existingRule = rules.find((r) => r.source === rule.source && r.function === rule.function);

  if (!existingRule) {
    return { status };
  }

  const items = getRuleTargetDifferences(rule, existingRule);

  if (items.length) {
    return { status, items };
  }

  return;
};

/**
 * Checks target values of two rules, return values which presented only in first rule
 *
 * @param {DialRule} rule - DialRule
 * @param {DialRule} diffRule - DialRule
 * @returns {string[]} - array of strings from first rule, which not exist in second rule
 */
export const getRuleTargetDifferences = (rule: DialRule, diffRule: DialRule): string[] => {
  const ruleSet = new Set(diffRule.targets);
  return rule.targets.filter((r) => !ruleSet.has(r));
};
