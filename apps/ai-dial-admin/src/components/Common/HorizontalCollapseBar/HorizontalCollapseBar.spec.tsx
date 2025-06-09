import { fireEvent } from '@testing-library/dom';
import HorizontalCollapseBar from './HorizontalCollapseBar';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';

describe('Common components - HorizontalCollapseBar', () => {
  it('Should render successfully', () => {
    const { baseElement, getByTestId } = renderWithContext(
      <HorizontalCollapseBar width="0" title="title">
        <div></div>
      </HorizontalCollapseBar>,
    );
    expect(baseElement).toBeTruthy();

    const icon = getByTestId('visibility');
    fireEvent.click(icon);
    expect(getByTestId('collapseBarContainer').style.width).toBe('60px');
    fireEvent.click(icon);
    expect(getByTestId('collapseBarContainer').style.width).toBe('0px');
  });
});
