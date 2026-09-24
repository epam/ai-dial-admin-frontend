import { DialModelLimit } from '@/src/models/dial/model';
import { LimitType } from './constants';

export const getActiveLimitType = (limits?: DialModelLimit) => {
  if (limits && (limits.maxCompletionTokens != null || limits.maxPromptTokens != null)) {
    return LimitType.SeparateTokenAndCompletions;
  }

  if (limits && limits.maxTotalTokens != null) {
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
