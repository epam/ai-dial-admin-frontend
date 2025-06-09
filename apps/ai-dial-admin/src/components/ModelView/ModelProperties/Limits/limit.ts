import { DialModel } from '@/src/models/dial/model';

export enum LimitType {
  None = 'none',
  Total = 'total',
  SeparateTokenAndCompletions = 'separateToken&Completions',
}

export const getActiveLimitType = (model: DialModel) => {
  const limits = model.limits;

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
