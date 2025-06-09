import { isMediumScreen, isOnlyMediumScreen, isSmallScreen } from '../mobile';

describe('Utils :: window size', () => {
  let windowSpy;

  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('Should set is Small Screen true and is Medium false', () => {
    windowSpy.mockImplementation(() => ({
      innerWidth: 300,
    }));

    expect(isSmallScreen()).toBeTruthy();
    expect(isMediumScreen()).toBeTruthy();
    expect(isOnlyMediumScreen()).toBeFalsy();
  });

  it('Should set is Small Screen false and is Medium true', () => {
    windowSpy.mockImplementation(() => ({
      innerWidth: 700,
    }));

    expect(isSmallScreen()).toBeFalsy();
    expect(isMediumScreen()).toBeTruthy();
    expect(isOnlyMediumScreen()).toBeTruthy();
  });

  it('Should set is Small Screen false and is Medium false', () => {
    windowSpy.mockImplementation(() => ({
      innerWidth: 1960,
    }));

    expect(isMediumScreen()).toBeFalsy();
    expect(isSmallScreen()).toBeFalsy();
  });
});
