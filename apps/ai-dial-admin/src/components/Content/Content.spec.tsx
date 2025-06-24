import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Content from './Content';
import { describe, expect, test } from 'vitest';

describe('Components - Content', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Content isEnableAuth={true} beVersion={'1.0.0'}>
        <div>content</div>
      </Content>,
    );

    expect(baseElement).toBeTruthy();
  });
});
