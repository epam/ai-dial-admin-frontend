import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import MdViewer from '../MdViewer';

describe('MdViewer', () => {
  test('renders markdown body without leading frontmatter', () => {
    render(<MdViewer content={'---\nname: my-skill\n---\n# Heading\n\nBody text.'} />);

    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('Body text.')).toBeInTheDocument();
    expect(screen.queryByText('my-skill')).toBeNull();
  });
});
