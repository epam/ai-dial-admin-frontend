import { render } from '@testing-library/react';
import NoDataContent from './NoData';

describe('Common components - NoDataContent', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<NoDataContent emptyDataTitle="No data" />);

    expect(baseElement).toBeTruthy();
  });
});
