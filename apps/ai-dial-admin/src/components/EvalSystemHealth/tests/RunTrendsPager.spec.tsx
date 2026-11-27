import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RunTrendsPager from '@/src/components/EvalSystemHealth/RunTrendsPager';
import { ButtonsI18nKey, EvalSystemHealthI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the page label can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const pageLabel = (page: number, pages: number) =>
  `${EvalSystemHealthI18nKey.RunTrendsPageOf}:${JSON.stringify({ page, pages })}`;

const renderPager = (props: Partial<Parameters<typeof RunTrendsPager>[0]> = {}) => {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  render(
    <RunTrendsPager page={0} totalPages={3} isDisabled={false} onPrevious={onPrevious} onNext={onNext} {...props} />,
  );
  return { onPrevious, onNext };
};

const previousButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Previous });
const nextButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Next });

describe('RunTrendsPager', () => {
  test('reads the one-based page and the page count', () => {
    renderPager({ page: 1 });

    expect(screen.getByText(pageLabel(2, 3))).toBeTruthy();
    expect(screen.getByRole('navigation', { name: EvalSystemHealthI18nKey.RunTrendsPagination })).toBeTruthy();
  });

  test('disables previous on the first page and enables next', () => {
    renderPager({ page: 0 });

    expect(previousButton()).toBeDisabled();
    expect(nextButton()).toBeEnabled();
  });

  test('disables next on the last page and enables previous', () => {
    renderPager({ page: 2 });

    expect(previousButton()).toBeEnabled();
    expect(nextButton()).toBeDisabled();
  });

  test('disables both controls while a page is loading', () => {
    renderPager({ page: 1, isDisabled: true });

    expect(previousButton()).toBeDisabled();
    expect(nextButton()).toBeDisabled();
  });

  test('calls back on next and on previous', async () => {
    const user = userEvent.setup();
    const { onPrevious, onNext } = renderPager({ page: 1 });

    await user.click(nextButton());
    await user.click(previousButton());

    expect(onNext).toHaveBeenCalledOnce();
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  test('is not shown for a single page', () => {
    renderPager({ totalPages: 1 });

    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
