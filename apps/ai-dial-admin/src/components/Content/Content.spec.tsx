import { render } from '@testing-library/react';
import Content from './Content';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { hintSidebar: { show: false, content: null } };
  }),
}));

describe('Components - Content', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <Content isEnableAuth={true} beVersion={'1.0.0'}>
        <div>content</div>
      </Content>,
    );

    expect(baseElement).toBeTruthy();
  });
});
