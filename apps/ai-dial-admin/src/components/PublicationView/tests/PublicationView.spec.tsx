import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { ApplicationRoute } from '@/src/types/routes';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { Publication } from '@/src/models/dial/publications';
import PublicationView from '@/src/components/PublicationView/PublicationView';
import { fireEvent } from '@testing-library/react';

const onApprove = jest.fn().mockResolvedValue({ success: true });
const onDecline = jest.fn().mockResolvedValue({ success: true });
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Components - PublicationView', () => {
  it('Should correctly render PublicationView component', () => {
    const { getByTestId } = renderWithContext(
      <PublicationView
        view={ApplicationRoute.PromptPublications}
        publication={publicationPrompt as Publication}
        approvePublication={onApprove}
        declinePublication={onDecline}
      />,
    );
    const view = getByTestId('publication-view');
    const header = getByTestId('publication-view-header');

    expect(header).toBeTruthy();
    expect(view).toBeTruthy();
  });

  it('Should correctly approve publication', () => {
    const { getByTestId } = renderWithContext(
      <PublicationView
        view={ApplicationRoute.PromptPublications}
        publication={publicationPrompt as Publication}
        approvePublication={onApprove}
        declinePublication={onDecline}
      />,
    );

    const approveButton = getByTestId('publication-approve-button');
    fireEvent.click(approveButton);

    const approveModal = getByTestId('publication-approve-modal');
    expect(approveModal).toBeTruthy();

    const confirmApprove = getByTestId('publication-approve-modal-modalConfirm');
    fireEvent.click(confirmApprove);
    expect(onApprove).toHaveBeenCalled();
  });

  it('Should correctly decline publication', () => {
    const { getByTestId } = renderWithContext(
      <PublicationView
        view={ApplicationRoute.PromptPublications}
        publication={publicationPrompt as Publication}
        approvePublication={onApprove}
        declinePublication={onDecline}
      />,
    );

    const declineButton = getByTestId('publication-decline-button');
    fireEvent.click(declineButton);

    const declineModal = getByTestId('publication-decline-modal');
    expect(declineModal).toBeTruthy();

    const confirmDecline = getByTestId('publication-decline-modal-modalConfirm');
    fireEvent.click(confirmDecline);
    expect(onDecline).toHaveBeenCalled();
  });
});
