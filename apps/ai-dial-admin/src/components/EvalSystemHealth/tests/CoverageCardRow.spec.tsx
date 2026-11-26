import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import CoverageCardRow from '@/src/components/EvalSystemHealth/CoverageCardRow';
import { CoverageCardModel, CoverageKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

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
  test('renders the cards it is given in order', () => {
    render(
      <CoverageCardRow
        cards={[
          card(CoverageKind.Models),
          card(CoverageKind.Applications),
          card(CoverageKind.Toolsets),
          card(CoverageKind.Routes),
        ]}
      />,
    );

    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      EvalSystemHealthI18nKey.TotalModels,
      EvalSystemHealthI18nKey.TotalApplications,
      EvalSystemHealthI18nKey.TotalToolsets,
      EvalSystemHealthI18nKey.TotalRoutes,
    ]);
  });

  test('keeps the cards of other kinds when one card failed', () => {
    render(
      <CoverageCardRow
        cards={[
          card(CoverageKind.Models, { status: CoverageStatus.Error }),
          card(CoverageKind.Applications),
          card(CoverageKind.Toolsets),
          card(CoverageKind.Routes, { status: CoverageStatus.Error }),
        ]}
      />,
    );

    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  test('renders nothing when it is given no cards', () => {
    render(<CoverageCardRow cards={[]} />);

    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });
});
