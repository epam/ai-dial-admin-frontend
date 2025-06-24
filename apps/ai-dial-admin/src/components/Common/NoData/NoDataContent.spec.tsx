import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import NoDataContent from './NoData';

describe('Common components - NoDataContent', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<NoDataContent emptyDataTitle="No data" />);

    expect(baseElement).toBeTruthy();
  });
});
