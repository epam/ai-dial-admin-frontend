import { render, screen } from '@testing-library/react';
import { IHeaderGroupParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ProvenanceHeaderGroup, {
  ProvenanceHeaderGroupParams,
} from '@/src/components/Analytics/SessionsTrace/List/ProvenanceHeaderGroup';
import { ColumnProvenance } from '@/src/models/analytics/sessions-trace';

const renderHeader = (params: ProvenanceHeaderGroupParams) =>
  render(<ProvenanceHeaderGroup {...(params as IHeaderGroupParams & ProvenanceHeaderGroupParams)} />);

describe('ProvenanceHeaderGroup', () => {
  test('renders the group label', () => {
    renderHeader({ label: 'sessions', provenance: ColumnProvenance.Sessions });

    expect(screen.getByText('sessions')).toBeInTheDocument();
  });

  test.each([
    [ColumnProvenance.Sessions, 'text-accent-primary'],
    [ColumnProvenance.Feedback, 'text-warning'],
  ])('colours %s with a theme token rather than a literal colour', (provenance, expectedClass) => {
    renderHeader({ label: 'source', provenance });

    expect(screen.getByText('source')).toHaveClass(expectedClass);
  });

  test('every provenance resolves to a colour, so a new one cannot render unstyled', () => {
    Object.values(ColumnProvenance).forEach((provenance) => {
      const { unmount } = renderHeader({ label: provenance, provenance });
      expect(screen.getByText(provenance).className).toMatch(/text-/);
      unmount();
    });
  });

  // No group on this page is enrichment-derived, so no group carries a derived-data icon.
  test('shows no icon, since every column is read straight from a source table', () => {
    const { container } = renderHeader({ label: 'sessions', provenance: ColumnProvenance.Sessions });

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
