import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import MetricCardDescription from '../MetricCardDescription';

const setOverflow = (scrollHeight: number, clientHeight: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
};

describe('MetricCardDescription', () => {
  afterEach(() => {
    setOverflow(0, 0);
  });

  test('does not show toggle when content fits', () => {
    render(<MetricCardDescription>Short</MetricCardDescription>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows Show more with a chevron when content overflows', () => {
    setOverflow(200, 100);
    render(<MetricCardDescription>Long description</MetricCardDescription>);

    const toggle = screen.getByRole('button', { name: ButtonsI18nKey.ShowMore });
    expect(toggle).toHaveClass('dial-tiny-semi-text');
    expect(toggle.querySelector('svg')).toBeTruthy();
  });

  test('toggles to Show less on click', () => {
    setOverflow(200, 100);
    render(<MetricCardDescription>Long description</MetricCardDescription>);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowLess })).toBeInTheDocument();
  });
});
