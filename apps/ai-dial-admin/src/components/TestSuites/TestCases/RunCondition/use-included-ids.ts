'use client';

import { useMemo } from 'react';

import { FilterNode } from '@/src/models/evaluation/structured-query';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

import { computeIncludedIdsFromRows } from './utils';

export const useIncludedIds = (
  testCaseFilter: FilterNode | null | undefined,
  rows: Record<string, unknown>[],
  schema?: TestCaseSchema[],
): Set<string> | null =>
  useMemo(() => computeIncludedIdsFromRows(rows, testCaseFilter, schema), [rows, testCaseFilter, schema]);
