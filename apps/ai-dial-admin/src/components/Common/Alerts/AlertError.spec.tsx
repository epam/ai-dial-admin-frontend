import { render, screen } from '@testing-library/react';
import AlertError from './AlertError';

describe('Common components :: AlertsError', () => {
  it('should render the provided alert text', () => {
    const alertText = 'alert text';
    render(<AlertError text={alertText} />);

    expect(screen.getByText(alertText)).toBeInTheDocument();
  });
});
