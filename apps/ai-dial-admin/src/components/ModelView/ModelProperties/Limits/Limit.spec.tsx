import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { getActiveLimitType, isLimitTypeSeparateTokenAndCompletions, isLimitTypeTotal, LimitType } from './limit';
import Limits from './Limits';

describe('Limits', () => {
  it('Should render successfully when LimitType.None', () => {
    const { baseElement } = renderWithContext(<Limits model={{}} onChangeModel={jest.fn()} />);
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully when LimitType.SeparateTokenAndCompletions', () => {
    const { baseElement } = renderWithContext(
      <Limits model={{ limits: { maxCompletionTokens: 2, maxPromptTokens: 2 } }} onChangeModel={jest.fn()} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully when LimitType.Total', () => {
    const { baseElement } = renderWithContext(
      <Limits model={{ limits: { maxTotalTokens: 3 } }} onChangeModel={jest.fn()} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Limits :: getActiveLimitType', () => {
  it('Should return LimitType.None', () => {
    expect(getActiveLimitType({ limits: {} })).toBe(LimitType.None);
  });

  it('Should return LimitType.SeparateTokenAndCompletions', () => {
    expect(getActiveLimitType({ limits: { maxCompletionTokens: 2, maxPromptTokens: 2 } })).toBe(
      LimitType.SeparateTokenAndCompletions,
    );
  });

  it('Should return LimitType.SeparateTokenAndCompletions', () => {
    expect(getActiveLimitType({ limits: { maxTotalTokens: 3 } })).toBe(LimitType.Total);
  });
});

describe('Limits :: LimitType', () => {
  it('Should return true', () => {
    expect(isLimitTypeTotal(LimitType.Total)).toBeTruthy();
  });

  it('Should return false', () => {
    expect(isLimitTypeTotal(LimitType.SeparateTokenAndCompletions)).toBeFalsy();
  });

  it('Should return true', () => {
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.SeparateTokenAndCompletions)).toBeTruthy();
  });

  it('Should return false', () => {
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.None)).toBeFalsy();
  });
});
