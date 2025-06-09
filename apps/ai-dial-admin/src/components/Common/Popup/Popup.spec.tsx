import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { fireEvent } from '@testing-library/dom';
import Popup from './Popup';

describe('Common components :: Popup', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Popup onClose={jest.fn()} portalId="popupId">
        <div></div>
        <div></div>
      </Popup>,
    );

    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully with header and click close', () => {
    let isClose = false;
    const onClose = () => {
      isClose = true;
    };

    const { baseElement, getByTestId } = renderWithContext(
      <Popup onClose={onClose} portalId="popupId" heading={<span>heading</span>}>
        <div></div>
        <div></div>
      </Popup>,
    );

    expect(baseElement).toBeTruthy();
    expect(isClose).toBeFalsy();
    const closeBtn = getByTestId('modalClose');
    fireEvent.click(closeBtn);
    expect(isClose).toBeTruthy();
  });
});
