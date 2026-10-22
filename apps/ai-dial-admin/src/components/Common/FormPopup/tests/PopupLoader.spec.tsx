import { render, screen } from '@testing-library/react';

import PopupLoader from '@/src/components/Common/FormPopup/PopupLoader';

describe('PopupLoader', () => {
  test('Should render the spinner', () => {
    render(<PopupLoader />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
