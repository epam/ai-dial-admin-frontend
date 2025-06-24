import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import AlertError from './AlertError';

describe('Common components :: AlertsError', () => {
  test('should render the provided alert text', () => {
    const alertText = 'alert text';
    render(<AlertError text={alertText} />);

    expect(screen.getByText(alertText)).toBeInTheDocument();
  });
});
