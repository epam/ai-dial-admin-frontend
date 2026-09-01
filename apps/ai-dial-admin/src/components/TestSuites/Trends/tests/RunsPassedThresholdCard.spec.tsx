import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import RunsPassedThresholdCard from '@/src/components/TestSuites/Trends/RunsPassedThresholdCard';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

describe('RunsPassedThresholdCard', () => {
  test('renders title keys, X / Y metric, and zero-count legend labels', () => {
    const { container } = render(
      <RunsPassedThresholdCard
        className="flex-1 sm:min-w-[180px]"
        stats={{ passed: 3, failed: 0, error: 0, total: 7 }}
      />,
    );

    expect(screen.getByText(new RegExp(TestSuitesI18nKey.RunsPassedThreshold))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TestSuitesI18nKey.TrendsLastNRuns))).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/ 7')).toBeInTheDocument();
    expect(screen.getByText(`3 ${RunsI18nKey.Pass}`)).toBeInTheDocument();
    expect(screen.getByText(`0 ${RunsI18nKey.Fail}`)).toBeInTheDocument();
    expect(screen.getByText(`0 ${RunsI18nKey.ExecError}`)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flex-1', 'sm:min-w-[180px]');
  });
});
