import { ApplicationRoute } from '@/src/types/routes';
import { render } from '@testing-library/react';
import ForwardAuthTokenField from './ForwardAuthTokenField';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { sidebarOpen: true, toggleSidebar: vi.fn() };
  }),
}));

const mockFunction = vi.fn();

describe('ForwardToken :: ForwardAuthTokenField', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <ForwardAuthTokenField
        entity={{ name: 'entity', forwardAuthToken: true }}
        onChangeEntity={mockFunction}
        view={ApplicationRoute.Applications}
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully', () => {
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
