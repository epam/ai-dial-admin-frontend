import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';

describe('QueryBuilder :: SectionBlock', () => {
  test('renders title, action slot, and children', () => {
    render(
      <SectionBlock title="Group by" action={<button>add</button>}>
        <span>body</span>
      </SectionBlock>,
    );

    expect(screen.getByRole('heading', { name: 'Group by' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'add' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  test('renders without a marker or action', () => {
    render(
      <SectionBlock title="Sort">
        <span>body</span>
      </SectionBlock>,
    );

    expect(screen.getByRole('heading', { name: 'Sort' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
