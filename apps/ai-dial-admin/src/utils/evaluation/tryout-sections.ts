import { InputBinding, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { getRequestCount, toRequestView } from '@/src/utils/evaluation/request-chain';
import { getPerTurnFieldNames } from '@/src/utils/evaluation/test-case-grouping';

export type TryOutSectionShape = 'single' | 'turns' | 'requests' | 'combined';

export interface TryOutSectionGroup<T> {
  requestIndex: number;
  turns: { turnIndex: number; item: T }[];
}

export interface IndexedTryOutItem {
  requestIndex?: number;
  turnIndex?: number;
}

const bindingsReferencePerTurnField = (bindings: InputBinding[] | undefined, perTurn: Set<string>): boolean =>
  (bindings ?? []).some((binding) => !!binding.dataField && perTurn.has(binding.dataField));

/** Turn count for each chain request (request-major), matching backend per-request multi-turn detection. */
export const getRequestTurnCounts = (
  suite: TestSuite,
  schema: TestCaseSchema[] | undefined,
  multiTurnLength: number,
): number[] => {
  const perTurn = getPerTurnFieldNames(schema);
  const requestCount = getRequestCount(suite);
  const turnLength = multiTurnLength > 1 ? multiTurnLength : 1;

  return Array.from({ length: requestCount }, (_, requestIndex) => {
    const bindings = toRequestView(suite, requestIndex).inputBindings;
    return bindingsReferencePerTurnField(bindings, perTurn) && turnLength > 1 ? turnLength : 1;
  });
};

export const getTryOutSectionShape = (turnCounts: number[]): TryOutSectionShape => {
  if (turnCounts.length === 0) {
    return 'single';
  }

  const multiRequest = turnCounts.length > 1;
  const multiTurn = turnCounts.some((count) => count > 1);

  if (multiRequest && multiTurn) {
    return 'combined';
  }
  if (multiRequest) {
    return 'requests';
  }
  if (multiTurn) {
    return 'turns';
  }
  return 'single';
};

/** True when a request group should show per-turn headings (executed or planned multi-turn). */
export const shouldShowTurnLabels = (group: TryOutSectionGroup<unknown>, turnCounts: number[]): boolean =>
  group.turns.length > 1 || (turnCounts[group.requestIndex] ?? 1) > 1;

const allItemsHaveRequestIndex = <T extends IndexedTryOutItem>(items: T[]): boolean =>
  items.length > 0 && items.every((item) => typeof item.requestIndex === 'number');

/** Group a flat Try Out list into request → turns using planned turn counts or explicit indices. */
export const groupTryOutSections = <T extends IndexedTryOutItem>(
  items: T[],
  turnCounts: number[],
): TryOutSectionGroup<T>[] => {
  if (items.length === 0 || turnCounts.length === 0) {
    return [];
  }

  if (allItemsHaveRequestIndex(items)) {
    const byRequest = new Map<number, TryOutSectionGroup<T>>();

    for (const item of items) {
      const requestIndex = item.requestIndex as number;
      let group = byRequest.get(requestIndex);
      if (!group) {
        group = { requestIndex, turns: [] };
        byRequest.set(requestIndex, group);
      }
      group.turns.push({
        turnIndex: typeof item.turnIndex === 'number' ? item.turnIndex : group.turns.length,
        item,
      });
    }

    return [...byRequest.values()].sort((a, b) => a.requestIndex - b.requestIndex);
  }

  const groups: TryOutSectionGroup<T>[] = [];
  let cursor = 0;

  for (let requestIndex = 0; requestIndex < turnCounts.length && cursor < items.length; requestIndex++) {
    const planned = turnCounts[requestIndex];
    const turns: TryOutSectionGroup<T>['turns'] = [];

    for (let turnIndex = 0; turnIndex < planned && cursor < items.length; turnIndex++) {
      turns.push({ turnIndex, item: items[cursor] });
      cursor += 1;
    }

    if (turns.length > 0) {
      groups.push({ requestIndex, turns });
    }
  }

  return groups;
};
