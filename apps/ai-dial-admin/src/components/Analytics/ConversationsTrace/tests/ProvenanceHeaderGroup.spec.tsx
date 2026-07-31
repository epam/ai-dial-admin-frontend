import { render, screen } from '@testing-library/react';
import { IHeaderGroupParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ProvenanceHeaderGroup, {
  ProvenanceHeaderGroupParams,
} from '@/src/components/Analytics/ConversationsTrace/List/ProvenanceHeaderGroup';
import { ColumnProvenance } from '@/src/models/analytics/conversations-trace';

const renderHeader = (params: ProvenanceHeaderGroupParams) =>
  render(<ProvenanceHeaderGroup {...(params as IHeaderGroupParams & ProvenanceHeaderGroupParams)} />);

describe('ProvenanceHeaderGroup', () => {
  test('renders the group label', () => {
    renderHeader({ label: 'dial_usage_log', provenance: ColumnProvenance.UsageLog });

    expect(screen.getByText('dial_usage_log')).toBeInTheDocument();
  });

  test.each([
    [ColumnProvenance.Conversation, 'text-secondary'],
    [ColumnProvenance.UsageLog, 'text-accent-primary'],
    [ColumnProvenance.Enrichment, 'text-accent-secondary'],
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

  test('marks a derived group with an icon', () => {
    const { container } = renderHeader({
      label: 'enrichment',
      provenance: ColumnProvenance.Enrichment,
      isDerived: true,
    });

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('shows no icon for a group read straight from a source table', () => {
    const { container } = renderHeader({ label: 'dial_usage_log', provenance: ColumnProvenance.UsageLog });

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  // The icon is decorative — the label already names the source, so it must not be announced twice.
  test('hides the icon from assistive technology', () => {
    const { container } = renderHeader({
      label: 'enrichment',
      provenance: ColumnProvenance.Enrichment,
      isDerived: true,
    });

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden');
  });
});
