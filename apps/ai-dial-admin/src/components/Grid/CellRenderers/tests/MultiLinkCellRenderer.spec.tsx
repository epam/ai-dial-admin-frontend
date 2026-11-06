import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { MultiLinkCellRendererParams } from '@/src/components/Grid/CellRenderers/models';
import MultiLinkCellRenderer from '@/src/components/Grid/CellRenderers/MultiLinkCellRenderer';

interface Row {
  inputs: string[];
}

const getLinks = (data?: Row) => (data?.inputs ?? []).map((input) => ({ label: input, href: `/tables/${input}` }));

const renderCell = (params: Partial<MultiLinkCellRendererParams<Row>>) =>
  render(<MultiLinkCellRenderer {...(params as MultiLinkCellRendererParams<Row>)} />);

describe('MultiLinkCellRenderer', () => {
  test('renders each value as its own link', () => {
    renderCell({ data: { inputs: ['usage', 'sessions'] }, getLinks });

    expect(screen.getByRole('link', { name: 'usage' })).toHaveAttribute('href', '/tables/usage');
    expect(screen.getByRole('link', { name: 'sessions' })).toHaveAttribute('href', '/tables/sessions');
  });

  test('renders a value without an address as plain text', () => {
    renderCell({ data: { inputs: ['usage'] }, getLinks: () => [{ label: 'usage' }] });

    expect(screen.getByText('usage')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  test('falls back to the formatted value as text when there are no links', () => {
    renderCell({ data: { inputs: [] }, value: 'Follows its target', getLinks });

    expect(screen.getByText('Follows its target')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  test('opens every link in a new tab when asked', () => {
    renderCell({ data: { inputs: ['usage', 'sessions'] }, getLinks, isNewTab: true });

    screen.getAllByRole('link').forEach((link) => expect(link).toHaveAttribute('target', '_blank'));
  });
});
