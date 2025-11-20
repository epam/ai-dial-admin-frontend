import { DialModelLimit } from '@/src/models/dial/model';
import { LimitType } from './constants';

export const getActiveLimitType = (limits?: DialModelLimit) => {
  if (limits && 'maxCompletionTokens' in limits && 'maxPromptTokens' in limits) {
    return LimitType.SeparateTokenAndCompletions;
  }

  if (limits && 'maxTotalTokens' in limits) {
    return LimitType.Total;
  }

  return LimitType.None;
};

export const isLimitTypeTotal = (type: string): boolean => {
  return type === LimitType.Total;
};

export const isLimitTypeSeparateTokenAndCompletions = (type: string): boolean => {
  return type === LimitType.SeparateTokenAndCompletions;
};
