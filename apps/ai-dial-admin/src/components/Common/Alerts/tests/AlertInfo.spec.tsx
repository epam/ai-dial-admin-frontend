import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import AlertInfo from '../AlertInfo';

describe('Common components :: AlertInfo', () => {
  test('should render the provided alert text', () => {
    const alertText = 'alert text';
    render(<AlertInfo text={alertText} />);

    expect(screen.getByText(alertText)).toBeInTheDocument();
  });
});
