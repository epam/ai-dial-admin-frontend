import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import PublicationsList from '@/src/components/Publications/List/List';
import { Publication } from '@/src/models/dial/publications';

describe('PublicationsList', () => {
  test('renders a request name as a link to its publication page', async () => {
    render(
      <PublicationsList data={[{ url: 'publications/req-1', requestName: 'Release 1' } as unknown as Publication]} />,
    );

    const link = await screen.findByRole('link', { name: 'Release 1' });
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toContain('/publications/');
  });
});
