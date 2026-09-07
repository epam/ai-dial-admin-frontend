import { QueryFunction, QueryFunctionGroup } from '@/src/models/analytics/query-function';

export const requiredArity = (fn: QueryFunction): number => fn.args.filter((arg) => !arg.optional).length;

export const toMeasureFunctions = (catalog: QueryFunction[]): QueryFunction[] =>
  catalog.filter((fn) => fn.group === QueryFunctionGroup.Aggregate && requiredArity(fn) <= 1);

export const isColumnlessFunction = (fn?: QueryFunction): boolean => Boolean(fn) && fn!.args.length === 0;

export const findMeasureFunction = (catalog: QueryFunction[], name?: string): QueryFunction | undefined =>
  name ? catalog.find((fn) => fn.name === name) : undefined;
