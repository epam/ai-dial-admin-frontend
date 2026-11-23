import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import CoverageCardRow from '@/src/components/EvalSystemHealth/CoverageCardRow';
import { CoverageCardModel, CoverageKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useCoverageData } from '@/src/components/EvalSystemHealth/use-coverage-data';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/use-coverage-data', () => ({ useCoverageData: vi.fn() }));

const card = (kind: CoverageKind, overrides: Partial<CoverageCardModel> = {}): CoverageCardModel => ({
  kind,
  status: CoverageStatus.Ready,
  total: 10,
  covered: 5,
  uncovered: 5,
  rate: 0.5,
  ...overrides,
});

describe('CoverageCardRow', () => {
  test('renders the four cards in order', () => {
    vi.mocked(useCoverageData).mockReturnValue([
      card(CoverageKind.Evaluatees),
      card(CoverageKind.Models),
      card(CoverageKind.Applications),
      card(CoverageKind.Toolsets),
    ]);

    render(<CoverageCardRow />);

    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      EvalSystemHealthI18nKey.TotalEvaluatees,
      EvalSystemHealthI18nKey.TotalModels,
      EvalSystemHealthI18nKey.TotalApplications,
      EvalSystemHealthI18nKey.TotalToolsets,
    ]);
  });

  test('keeps the cards of other kinds when one card failed', () => {
    vi.mocked(useCoverageData).mockReturnValue([
      card(CoverageKind.Evaluatees, { status: CoverageStatus.Error }),
      card(CoverageKind.Models),
      card(CoverageKind.Applications),
      card(CoverageKind.Toolsets, { status: CoverageStatus.Error }),
    ]);

    render(<CoverageCardRow />);

    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });
});
