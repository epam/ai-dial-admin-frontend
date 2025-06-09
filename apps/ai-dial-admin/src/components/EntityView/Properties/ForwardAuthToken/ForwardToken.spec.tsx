import { ApplicationRoute } from '@/src/types/routes';
import { render } from '@testing-library/react';
import ForwardAuthTokenField from './ForwardAuthTokenField';

jest.mock('@/src/context/AppContext', () => ({
  useAppContext: jest.fn(() => {
    return { sidebarOpen: true, toggleSidebar: jest.fn() };
  }),
}));

const mockFunction = jest.fn();

describe('ForwardToken :: ForwardAuthTokenField', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <ForwardAuthTokenField
        entity={{ name: 'entity', forwardAuthToken: true }}
        onChangeEntity={mockFunction}
        view={ApplicationRoute.Applications}
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully', () => {
    const { baseElement } = render(
      <ForwardAuthTokenField
        entity={{ name: 'entity', forwardAuthToken: true }}
        onChangeEntity={mockFunction}
        view={ApplicationRoute.Routes}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
