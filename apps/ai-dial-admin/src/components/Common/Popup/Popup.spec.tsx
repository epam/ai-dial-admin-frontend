import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import Popup from './Popup';
import { describe, expect, test, vi } from 'vitest';

describe('Common components :: Popup', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <Popup onClose={vi.fn()} portalId="popupId">
        <div></div>
        <div></div>
      </Popup>,
    );

    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully with header and click close', () => {
    let isClose = false;
    const onClose = () => {
      isClose = true;
    };

    const { baseElement, getByTestId } = render(
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
