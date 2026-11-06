import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EntityLinkCell from '@/src/components/Grid/CellRenderers/EntityLinkCell';
import LinkCellRenderer from '@/src/components/Grid/CellRenderers/LinkCellRenderer';
import { LinkCellRendererParams } from '@/src/components/Grid/CellRenderers/models';

interface Row {
  id: string;
}

const renderCell = (params: Partial<LinkCellRendererParams<Row>>) =>
  render(<LinkCellRenderer {...(params as LinkCellRendererParams<Row>)} />);

describe('EntityLinkCell', () => {
  test('renders its content as a link to the given address', () => {
    render(<EntityLinkCell href="/models/gpt">GPT</EntityLinkCell>);

    expect(screen.getByRole('link', { name: 'GPT' })).toHaveAttribute('href', '/models/gpt');
  });
});

describe('LinkCellRenderer', () => {
  test('renders the value as a link to the row address', () => {
    renderCell({ value: 'nightly', data: { id: 'suite-1' }, getHref: (data) => `/test-suites/${data?.id}` });

    expect(screen.getByRole('link', { name: 'nightly' })).toHaveAttribute('href', '/test-suites/suite-1');
  });

  test('prefers the formatted value as the link text', () => {
    renderCell({ value: 'raw', valueFormatted: 'Formatted', data: { id: 'a' }, getHref: () => '/a' });

    expect(screen.getByRole('link', { name: 'Formatted' })).toBeInTheDocument();
  });

  test('renders plain text when the row has no address', () => {
    renderCell({ value: 'nightly', data: { id: 'suite-1' }, getHref: () => undefined });

    expect(screen.getByText('nightly')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  test('renders no link for an empty value', () => {
    renderCell({ value: null, data: { id: 'suite-1' }, getHref: () => '/x' });

    expect(screen.queryByRole('link')).toBeNull();
  });
});
