'use client';

import { useCallback, useState } from 'react';

import { SpanFieldGroup } from '@/src/models/analytics/conversations-trace';

interface Params {
  groups: SpanFieldGroup[];
}

/**
 * Which field group is open. The chosen tag survives a change of selected span — a reader comparing one group
 * across two hops is asking the same question twice — but opens nothing until the current field set reports a
 * group for it.
 */
export const useSpanFieldGroups = ({ groups }: Params) => {
  const [chosenTag, setChosenTag] = useState<string | null>(null);
  const openTag = groups.some(({ tag }) => tag === chosenTag) ? chosenTag : null;

  const onToggleGroup = useCallback((tag: string) => setChosenTag((previous) => (previous === tag ? null : tag)), []);

  return { openTag, onToggleGroup };
};
