import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import NoDataContent from './NoData';

describe('NoDataContent', () => {
  test('renders icon and title', () => {
    render(<NoDataContent emptyDataTitle="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  test('renders icon and title', () => {
    render(<NoDataContent emptyDataTitle="No data available" icon={<div></div>} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
