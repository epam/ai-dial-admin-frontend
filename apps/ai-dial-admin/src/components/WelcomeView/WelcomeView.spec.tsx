import { fireEvent } from '@testing-library/react';
import WelcomeView from './WelcomeView';
import { ApplicationRoute } from '@/src/types/routes';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';

const router: ApplicationRoute[] = [];
jest.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: jest.fn(),
}));

describe('WelcomeView', () => {
  beforeAll(() => {
    global.window.open = jest.fn();
  });

  it('Should render successfully', () => {
    const { baseElement, getByTestId } = renderWithContext(
      <WelcomeView availableMenuItems={[]} disableMenuItems={[]} dialLink="link" docLink="link" />,
    );
    expect(baseElement).toBeTruthy();

    const documentation = getByTestId('documentation-btn');
    const dial = getByTestId('dial-btn');
    const importBtn = getByTestId('import-btn');
    const exportBtn = getByTestId('export-btn');

    fireEvent.click(documentation);
    fireEvent.click(dial);
    fireEvent.click(importBtn);
    fireEvent.click(exportBtn);

    expect(router).toEqual([ApplicationRoute.ImportConfig, ApplicationRoute.ExportConfig]);
  });
});
