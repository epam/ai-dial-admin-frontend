import { applyThemeColors } from '../apply-theme-colors';

describe('Utils :: applyThemeColors', () => {
  it('Should do not find theme', () => {
    const div = document.createElement('div');
    applyThemeColors(div, { id: 'theme', displayName: 'theme', colors: { red2: 'red' } });

    expect(div.style.getPropertyValue('--red')).toBe('');
  });

  it('Should do not find theme', () => {
    const div = document.createElement('div');
    applyThemeColors(div);

    expect(div.style.getPropertyValue('--red')).toBe('');
  });

  it('Should set colors', () => {
    const div = document.createElement('div');
    applyThemeColors(div, { id: 'theme', displayName: 'theme', colors: { red: 'red' } });
    expect(div.style.getPropertyValue('--red')).toBe('red');
  });
});
