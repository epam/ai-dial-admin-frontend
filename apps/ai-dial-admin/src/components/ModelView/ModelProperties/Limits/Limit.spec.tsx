import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { getActiveLimitType, isLimitTypeSeparateTokenAndCompletions, isLimitTypeTotal, LimitType } from './limit';
import Limits from './Limits';

describe('Limits', () => {
  test('Should render successfully when LimitType.None', () => {
    const { baseElement } = render(<Limits model={{}} onChangeModel={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully when LimitType.SeparateTokenAndCompletions', () => {
    const { baseElement } = render(
      <Limits model={{ limits: { maxCompletionTokens: 2, maxPromptTokens: 2 } }} onChangeModel={vi.fn()} />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully when LimitType.Total', () => {
    const { baseElement } = render(
      <Limits model={{ limits: { maxTotalTokens: 3 } }} onChangeModel={vi.fn()} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Limits :: getActiveLimitType', () => {
  test('Should return LimitType.None', () => {
    expect(getActiveLimitType({ limits: {} })).toBe(LimitType.None);
  });

  test('Should return LimitType.SeparateTokenAndCompletions', () => {
    expect(getActiveLimitType({ limits: { maxCompletionTokens: 2, maxPromptTokens: 2 } })).toBe(
      LimitType.SeparateTokenAndCompletions,
    );
  });

  test('Should return LimitType.SeparateTokenAndCompletions', () => {
    expect(getActiveLimitType({ limits: { maxTotalTokens: 3 } })).toBe(LimitType.Total);
  });
});

describe('Limits :: LimitType', () => {
  test('Should return true', () => {
    expect(isLimitTypeTotal(LimitType.Total)).toBeTruthy();
  });

  test('Should return false', () => {
    expect(isLimitTypeTotal(LimitType.SeparateTokenAndCompletions)).toBeFalsy();
  });

  test('Should return true', () => {
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.SeparateTokenAndCompletions)).toBeTruthy();
  });

  test('Should return false', () => {
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.None)).toBeFalsy();
  });
});
