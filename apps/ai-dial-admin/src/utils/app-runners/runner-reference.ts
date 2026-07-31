import { SCHEMAS_PREFIX } from '@/src/constants/publications-core';
import { fromCoreRunnerName, toCoreRunnerName } from './core-runner-name';

export const toRunnerReference = (id: string): string => `${SCHEMAS_PREFIX}${toCoreRunnerName(id)}`;

export const fromRunnerReference = (reference: string): string | undefined =>
  reference.startsWith(SCHEMAS_PREFIX) ? fromCoreRunnerName(reference.slice(SCHEMAS_PREFIX.length)) : undefined;
