import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import RangePicker from './RangePicker';

describe('Common components - RangePicker', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <RangePicker timeRange={{ endDate: new Date(), startDate: new Date() }} onChange={() => void 0} />,
    );

    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully with empty time range', () => {
    const { baseElement } = renderWithContext(<RangePicker timeRange={null} onChange={() => void 0} />);

    expect(baseElement).toBeTruthy();
  });
});
