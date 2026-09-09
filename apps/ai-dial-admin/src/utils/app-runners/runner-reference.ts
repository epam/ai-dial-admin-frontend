import { SCHEMAS_PREFIX } from '@/src/constants/publications-core';
import { fromCoreRunnerName, toCoreRunnerName } from './core-runner-name';

/**
 * The publication form of a runner id: `schemas/platform/<url-encoded $id>`, a Core *resource* path.
 * Core's own `application_type_schema_id` takes the runner's raw `$id` instead — seeding this form
 * there makes Core reject the application with "Custom application schema not found".
 */
export const toRunnerReference = (id: string): string => `${SCHEMAS_PREFIX}${toCoreRunnerName(id)}`;

export const fromRunnerReference = (reference: string): string | undefined =>
  reference.startsWith(SCHEMAS_PREFIX) ? fromCoreRunnerName(reference.slice(SCHEMAS_PREFIX.length)) : undefined;
