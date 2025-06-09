import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import BasePublicationHeader from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationHeader';
import { fireEvent } from '@testing-library/react';

const onApprove = jest.fn();
const onDecline = jest.fn();

describe('Components - BasePublicationHeader', () => {
  it('Should correctly render BasePublicationHeader component', () => {
    const { getByTestId } = renderWithContext(<BasePublicationHeader onApprove={onApprove} onDecline={onDecline} />);
    const declineButton = getByTestId('publication-decline-button');
    const approveButton = getByTestId('publication-approve-button');

    expect(declineButton).toBeTruthy();
    expect(approveButton).toBeTruthy();
  });

  it('Should correctly pass approve flow', () => {
    const { getByTestId } = renderWithContext(<BasePublicationHeader onApprove={onApprove} onDecline={onDecline} />);

    const approveButton = getByTestId('publication-approve-button');
    fireEvent.click(approveButton);

    const approveModal = getByTestId('publication-approve-modal');
    expect(approveModal).toBeTruthy();

    const confirmApprove = getByTestId('publication-approve-modal-modalConfirm');
    fireEvent.click(confirmApprove);
    expect(onApprove).toHaveBeenCalled();
  });

  it('Should correctly pass decline flow', () => {
    const { getByTestId } = renderWithContext(<BasePublicationHeader onApprove={onApprove} onDecline={onDecline} />);

    const declineButton = getByTestId('publication-decline-button');
    fireEvent.click(declineButton);

    const declineModal = getByTestId('publication-decline-modal');
    expect(declineModal).toBeTruthy();

    const confirmDecline = getByTestId('publication-decline-modal-modalConfirm');
    fireEvent.click(confirmDecline);
    expect(onDecline).toHaveBeenCalled();
  });
});
