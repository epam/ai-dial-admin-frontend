'use client';

import { useCallback, useRef } from 'react';

import { isEqual } from 'lodash';

import { BodyContent } from '@/src/components/TestSuites/utils/body-content';

interface JsonataExpressionStash {
  expression: string;
  content?: BodyContent;
}

interface UseJsonataExpressionStashReturn {
  stashExpression: (expression?: string, content?: BodyContent) => void;
  takeStashedExpression: (content?: BodyContent) => string | null;
}

export const useJsonataExpressionStash = (): UseJsonataExpressionStashReturn => {
  const stashRef = useRef<JsonataExpressionStash | null>(null);

  const stashExpression = useCallback((expression?: string, content?: BodyContent) => {
    stashRef.current = expression == null ? null : { expression, content };
  }, []);

  const takeStashedExpression = useCallback((content?: BodyContent) => {
    const stash = stashRef.current;
    stashRef.current = null;

    // The stash is valid only while `content` is still exactly what turning JSONata off produced — a JSON
    // body the user authored in between wins over the expression they left behind.
    return stash && isEqual(stash.content, content) ? stash.expression : null;
  }, []);

  return { stashExpression, takeStashedExpression };
};
