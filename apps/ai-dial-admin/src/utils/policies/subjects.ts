import { PolicySubjectFunction, PolicySubjectRule } from '@/src/models/dial/policy';

/** `TRUE` and `FALSE` match on the source alone, so they take no targets. */
export const isTargetlessFunction = (fn: PolicySubjectFunction): boolean =>
  fn === PolicySubjectFunction.TRUE || fn === PolicySubjectFunction.FALSE;

export const createEmptyRule = (): PolicySubjectRule => ({
  source: '',
  function: PolicySubjectFunction.EQUAL,
  targets: [],
});

export const addRule = (rules: PolicySubjectRule[] = []): PolicySubjectRule[] => [...rules, createEmptyRule()];

export const removeRule = (rules: PolicySubjectRule[] = [], index: number): PolicySubjectRule[] =>
  rules.filter((_, ruleIndex) => ruleIndex !== index);

/** Applies a change to one rule; switching to `TRUE`/`FALSE` also clears its targets. */
export const updateRule = (
  rules: PolicySubjectRule[] = [],
  index: number,
  patch: Partial<PolicySubjectRule>,
): PolicySubjectRule[] =>
  rules.map((rule, ruleIndex) => {
    if (ruleIndex !== index) {
      return rule;
    }

    const next = { ...rule, ...patch };
    return isTargetlessFunction(next.function) ? { ...next, targets: [] } : next;
  });

export const isSourceValid = (source?: string): boolean => !!source?.trim();

export const isFunctionValid = (fn: PolicySubjectFunction): boolean =>
  Object.values(PolicySubjectFunction).includes(fn);

export const areTargetsValid = (rule: PolicySubjectRule): boolean =>
  isTargetlessFunction(rule.function) ||
  (!!rule.targets?.length && rule.targets.every((target) => target != null && target !== ''));

/** Core requires a nonblank source, a recognized function and nonempty targets when the function uses them. */
export const isRuleValid = (rule: PolicySubjectRule): boolean =>
  isSourceValid(rule.source) && isFunctionValid(rule.function) && areTargetsValid(rule);

/** Every rule valid; an empty list is valid, since `subject` is optional and then omitted. */
export const areRulesValid = (rules?: PolicySubjectRule[]): boolean => (rules ?? []).every(isRuleValid);

/** An empty list is `undefined`: Core refuses `subject: []` because it would match everybody. */
export const normalizeSubject = (rules?: PolicySubjectRule[]): PolicySubjectRule[] | undefined =>
  rules?.length ? rules : undefined;
