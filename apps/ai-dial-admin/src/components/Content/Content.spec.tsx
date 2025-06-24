import { render } from '@testing-library/react';
import Content from './Content';
import { describe, expect, test } from 'vitest';

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
